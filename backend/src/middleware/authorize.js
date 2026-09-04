const EventMember = require('../models/EventMember');
const ClubMembership = require('../models/ClubMembership');
const TeamMembership = require('../models/TeamMembership');
const Team = require('../models/Team');
const Event = require('../models/Event');

exports.requireEventMember = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.params.id;
    const membership = await EventMember.findOne({ eventId, userId: req.user._id, status: 'ACCEPTED' });
    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this event.' });
    }
    req.eventMembership = membership;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.requireEventMemberForTask = async (req, res, next) => {
  try {
    const Task = require('../models/Task');
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const membership = await EventMember.findOne({ eventId: task.eventId, userId: req.user._id, status: 'ACCEPTED' });
    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this task\'s event.' });
    }
    req.task = task;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.requireEventHost = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (String(event.host) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the event host can do this.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.requireClubCoordinator = async (req, res, next) => {
  try {
    const clubId = req.params.clubId;
    const membership = await ClubMembership.findOne({
      clubId,
      userId: req.user._id,
      position: { $in: ['HEAD_COORDINATOR', 'JOINT_HEAD_COORDINATOR'] }
    });
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Only the Head or Joint Head Coordinator can do this.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.requireClubCoordinatorOrTeamLead = async (req, res, next) => {
  try {
    const clubId = req.params.clubId;
    const clubMembership = await ClubMembership.findOne({ clubId, userId: req.user._id });
    if (clubMembership) return next();

    const teams = await Team.find({ clubId });
    const leadMembership = await TeamMembership.findOne({
      teamId: { $in: teams.map((t) => t._id) },
      userId: req.user._id,
      role: { $in: ['HEAD', 'CO_HEAD'] },
      status: 'ACCEPTED'
    });
    if (leadMembership) return next();

    return res.status(403).json({ success: false, message: 'Only coordinators and team leads can view club-wide workload.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.requireTeamHeadOrCoordinator = async (req, res, next) => {
  try {
    const teamId = req.params.teamId;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });

    const teamMembership = await TeamMembership.findOne({ teamId, userId: req.user._id, role: { $in: ['HEAD', 'CO_HEAD'] }, status: 'ACCEPTED' });
    if (teamMembership) return next();

    const clubMembership = await ClubMembership.findOne({ clubId: team.clubId, userId: req.user._id });
    if (clubMembership) return next();

    return res.status(403).json({ success: false, message: 'Only the team head, co-head, or a club coordinator can add members.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.requireClubMemberOrCoordinator = async (req, res, next) => {
  try {
    const clubId = req.body.clubId || req.params.clubId;
    const clubMembership = await ClubMembership.findOne({ clubId, userId: req.user._id });
    if (clubMembership) return next();

    const teams = await Team.find({ clubId });
    const teamMembership = await TeamMembership.findOne({ teamId: { $in: teams.map((t) => t._id) }, userId: req.user._id, status: 'ACCEPTED' });
    if (teamMembership) return next();

    return res.status(403).json({ success: false, message: 'You are not part of this club.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.requireChannelMember = async (req, res, next) => {
  try {
    const { channelType, channelId } = req.params;
    const type = (channelType || '').toUpperCase();

    if (type === 'CLUB') {
      const clubMembership = await ClubMembership.findOne({ clubId: channelId, userId: req.user._id });
      if (clubMembership) return next();

      const teams = await Team.find({ clubId: channelId });
      const teamMembership = await TeamMembership.findOne({
        teamId: { $in: teams.map((t) => t._id) },
        userId: req.user._id,
        status: 'ACCEPTED'
      });
      if (teamMembership) return next();

      return res.status(403).json({ success: false, message: 'You are not part of this club.' });
    }

    if (type === 'TEAM') {
      const teamMembership = await TeamMembership.findOne({ teamId: channelId, userId: req.user._id, status: 'ACCEPTED' });
      if (teamMembership) return next();

      const team = await Team.findById(channelId);
      if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });

      const clubMembership = await ClubMembership.findOne({ clubId: team.clubId, userId: req.user._id });
      if (clubMembership) return next();

      return res.status(403).json({ success: false, message: 'You are not part of this team.' });
    }

    return res.status(400).json({ success: false, message: 'Unknown channel type.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
