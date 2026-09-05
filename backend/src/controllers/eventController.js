const Event = require('../models/Event');
const EventMember = require('../models/EventMember');
const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Comment = require('../models/Comment');
const Team = require('../models/Team');
const logActivity = require('../utils/logActivity');
const { computeCriticalPath } = require('../utils/criticalPath');
const { scoreEventRisk } = require('../utils/riskScorer');

exports.createEvent = async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, host: req.user._id });
    await EventMember.create({ eventId: event._id, userId: req.user._id, role: 'HEAD', status: 'ACCEPTED' });
    await logActivity(event._id, req.user._id, 'EVENT_CREATED', { title: event.title }, req.app.get('io'));
    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.listMyEvents = async (req, res) => {
  try {
    const memberships = await EventMember.find({ userId: req.user._id, status: 'ACCEPTED' });
    const eventIds = memberships.map((m) => m.eventId);
    const events = await Event.find({ _id: { $in: eventIds } }).populate('clubId', 'name').sort({ eventDate: 1 });
    res.status(200).json({ success: true, count: events.length, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listEventsByClub = async (req, res) => {
  try {
    const events = await Event.find({ clubId: req.params.clubId }).sort({ eventDate: 1 });
    res.status(200).json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('host', 'name email').populate('clubId', 'name');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const members = await EventMember.find({ eventId: event._id }).populate('userId', 'name email');
    const teams = await Team.find({ clubId: event.clubId._id }).select('name');
    res.status(200).json({ success: true, event, members, teams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No user found with that email.' });

    const existing = await EventMember.findOne({ eventId: req.params.id, userId: user._id });
    if (existing) return res.status(400).json({ success: false, message: 'This person has already been invited or is on the team.' });

    const member = await EventMember.create({ eventId: req.params.id, userId: user._id, role: 'MEMBER', status: 'PENDING' });
    await logActivity(req.params.id, req.user._id, 'MEMBER_INVITED', { name: user.name }, req.app.get('io'));

    res.status(201).json({ success: true, member: { ...member.toObject(), userId: { _id: user._id, name: user.name, email: user.email } } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.listMyPendingEventInvites = async (req, res) => {
  try {
    const invites = await EventMember.find({ userId: req.user._id, status: 'PENDING' }).populate('eventId', 'title eventDate');
    res.status(200).json({ success: true, invites });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.respondToEventInvite = async (req, res) => {
  try {
    const { accept } = req.body;
    const membership = await EventMember.findOne({ _id: req.params.membershipId, userId: req.user._id, status: 'PENDING' });
    if (!membership) return res.status(404).json({ success: false, message: 'No pending invite found.' });

    membership.status = accept ? 'ACCEPTED' : 'DECLINED';
    await membership.save();
    await logActivity(membership.eventId, req.user._id, accept ? 'MEMBER_JOINED' : 'MEMBER_DECLINED', { name: req.user.name }, req.app.get('io'));

    res.status(200).json({ success: true, membership });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getEventInsights = async (req, res) => {
  try {
    const eventId = req.params.id;
    const tasks = await Task.find({ eventId });

    let criticalPathResult = [];
    let cycleError = null;
    try {
      criticalPathResult = computeCriticalPath(tasks);
    } catch (err) {
      if (err.code === 'CYCLE_DETECTED') cycleError = err.message;
      else throw err;
    }

    const lastActivity = await ActivityLog.findOne({ eventId }).sort({ createdAt: -1 });
    const risk = scoreEventRisk({ tasks, criticalPathResult, lastActivityAt: lastActivity?.createdAt });

    res.status(200).json({
      success: true,
      criticalPath: criticalPathResult,
      cycleError,
      risk
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const allowedFields = ['title', 'description', 'eventDate', 'venue', 'budget', 'status'];
    const updates = {};
    allowedFields.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    const event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    await logActivity(event._id, req.user._id, 'EVENT_UPDATED', { title: event.title }, req.app.get('io'));
    res.status(200).json({ success: true, event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (String(event.host) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the event host can delete this event.' });
    }

    await Promise.all([
      Task.deleteMany({ eventId: event._id }),
      EventMember.deleteMany({ eventId: event._id }),
      ActivityLog.deleteMany({ eventId: event._id }),
      Comment.deleteMany({ eventId: event._id }),
      Event.findByIdAndDelete(event._id)
    ]);

    res.status(200).json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.leaveEvent = async (req, res) => {
  try {
    const membership = await EventMember.findOne({ eventId: req.params.id, userId: req.user._id });
    if (!membership) return res.status(404).json({ success: false, message: 'You are not on this event.' });

    const event = await Event.findById(req.params.id);
    if (event && String(event.host) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'The event host cannot leave - delete the event instead, or transfer hosting first.' });
    }

    await EventMember.findByIdAndDelete(membership._id);
    res.status(200).json({ success: true, message: 'You have left the event.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeEventMember = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (String(event.host) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the event host can remove members.' });
    }

    const membership = await EventMember.findById(req.params.membershipId);
    if (!membership) return res.status(404).json({ success: false, message: 'Membership not found.' });

    if (String(membership.userId) === String(event.host)) {
      return res.status(400).json({ success: false, message: 'The event host cannot be removed - delete the event instead, or transfer hosting first.' });
    }

    await Task.updateMany(
      { eventId: event._id, assignedTo: membership.userId, status: { $ne: 'DONE' } },
      { $set: { assignedTo: null } }
    );

    await EventMember.findByIdAndDelete(membership._id);
    res.status(200).json({ success: true, message: 'Member removed. Their open tasks are now unassigned.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
