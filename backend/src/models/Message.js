const mongoose = require('mongoose');

// A single unified model for both club-wide and per-team chat channels.
// channelType + channelId together identify the room (mirrors how the
// Socket.IO rooms are named: `club_<clubId>` or `team_<teamId>`).
const messageSchema = new mongoose.Schema({
  channelType: { type: String, enum: ['CLUB', 'TEAM'], required: true },
  channelId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true }
}, { timestamps: true });

messageSchema.index({ channelType: 1, channelId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
