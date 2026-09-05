require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const User = require('./models/User');
const ClubMembership = require('./models/ClubMembership');
const TeamMembership = require('./models/TeamMembership');
const Team = require('./models/Team');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const activityRoutes = require('./routes/activityRoutes');
const clubRoutes = require('./routes/clubRoutes');
const messageRoutes = require('./routes/messageRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' } });
app.set('io', io);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use('/api/auth', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/recruitment', recruitmentRoutes);

app.get('/', (req, res) => res.json({ success: true, message: 'CrewSync API is running. See /api/health for status.' }));
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

async function canAccessChannel(userId, channelType, channelId) {
  const type = (channelType || '').toUpperCase();

  if (type === 'CLUB') {
    const clubMembership = await ClubMembership.findOne({ clubId: channelId, userId });
    if (clubMembership) return true;
    const teams = await Team.find({ clubId: channelId });
    const teamMembership = await TeamMembership.findOne({ teamId: { $in: teams.map((t) => t._id) }, userId, status: 'ACCEPTED' });
    return !!teamMembership;
  }

  if (type === 'TEAM') {
    const teamMembership = await TeamMembership.findOne({ teamId: channelId, userId, status: 'ACCEPTED' });
    if (teamMembership) return true;
    const team = await Team.findById(channelId);
    if (!team) return false;
    const clubMembership = await ClubMembership.findOne({ clubId: team.clubId, userId });
    return !!clubMembership;
  }

  return false;
}

const channelPresence = new Map();

const presenceKey = (userId, channelRoom) => `${channelRoom}:${userId}`;
const broadcastPresence = (userId, channelRoom) => {
  io.to(channelRoom).emit('presence_update', {
    userId,
    online: (channelPresence.get(presenceKey(userId, channelRoom)) || 0) > 0
  });
};
const addPresence = (userId, channelRoom) => {
  const key = presenceKey(userId, channelRoom);
  channelPresence.set(key, (channelPresence.get(key) || 0) + 1);
  broadcastPresence(userId, channelRoom);
};
const removePresence = (userId, channelRoom) => {
  const key = presenceKey(userId, channelRoom);
  const remaining = (channelPresence.get(key) || 0) - 1;
  if (remaining > 0) channelPresence.set(key, remaining);
  else channelPresence.delete(key);
  broadcastPresence(userId, channelRoom);
};
const usersPresentIn = (channelRoom) => [...channelPresence.keys()]
  .filter((key) => key.startsWith(`${channelRoom}:`))
  .map((key) => key.slice(`${channelRoom}:`.length));

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Not authorized: no token provided.'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('Not authorized: user not found.'));
    socket.data.userId = String(user._id);
    next();
  } catch (err) {
    next(new Error('Not authorized: invalid or expired token.'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_event', async (eventId) => {
    const EventMember = require('./models/EventMember');
    const membership = await EventMember.findOne({ eventId, userId: socket.data.userId, status: 'ACCEPTED' });
    if (!membership) {
      socket.emit('event_join_denied', { eventId });
      return;
    }
    socket.join(`event_${eventId}`);
  });
  socket.on('leave_event', (eventId) => socket.leave(`event_${eventId}`));

  socket.on('join_channel', async ({ channelType, channelId }) => {
    const userId = socket.data.userId;
    const allowed = await canAccessChannel(userId, channelType, channelId);
    if (!allowed) {
      socket.emit('channel_join_denied', { channelType, channelId });
      return;
    }

    const room = `${channelType.toLowerCase()}_${channelId}`;
    socket.data.rooms = socket.data.rooms || new Set();
    if (socket.data.rooms.has(room)) return;
    socket.join(room);
    socket.data.rooms.add(room);
    addPresence(userId, room);
    socket.emit('presence_snapshot', { channelType, channelId, userIds: usersPresentIn(room) });
  });

  socket.on('leave_channel', ({ channelType, channelId }) => {
    const userId = socket.data.userId;
    const room = `${channelType.toLowerCase()}_${channelId}`;
    if (!socket.data.rooms?.has(room)) return;
    socket.leave(room);
    socket.data.rooms.delete(room);
    removePresence(userId, room);
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    if (!userId) return;
    (socket.data.rooms || []).forEach((room) => removePresence(userId, room));
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB()
    .then(() => server.listen(PORT, () => console.log(`CrewSync API running on port ${PORT}`)))
    .catch((err) => { console.error('Failed to connect to MongoDB:', err.message); process.exit(1); });
}

module.exports = { app, server, io };
