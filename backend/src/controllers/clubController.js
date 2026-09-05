const Club = require('../models/Club');
const ClubMembership = require('../models/ClubMembership');
const Team = require('../models/Team');
const TeamMembership = require('../models/TeamMembership');
const Event = require('../models/Event');
const Task = require('../models/Task');
const User = require('../models/User');
const { buildClubHeatmap } = require('../utils/clubWorkloadHeatmap');
const { buildPersonalLoad } = require('../utils/crossClubWorkload');

exports.createClub = async (req, res) => {
  try {
    const { name, description } = req.body;
    const club = await Club.create({ name, description, createdBy: req.user._id });
    await ClubMembership.create({ clubId: club._id, userId: req.user._id, position: 'HEAD_COORDINATOR' });
    res.status(201).json({ success: true, club });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.listMyClubs = async (req, res) => {
  try {
    const clubMemberships = await ClubMembership.find({ userId: req.user._id });
    const teamMemberships = await TeamMembership.find({ userId: req.user._id, status: 'ACCEPTED' }).populate('teamId');
    const clubIdsFromTeams = teamMemberships.map((tm) => tm.teamId?.clubId).filter(Boolean);
    const allClubIds = [...new Set([...clubMemberships.map((m) => String(m.clubId)), ...clubIdsFromTeams.map(String)])];
    const clubs = await Club.find({ _id: { $in: allClubIds } });
    res.status(200).json({ success: true, clubs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addClubCoordinator = async (req, res) => {
  try {
    const { email, position } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No user found with that email.' });
    if (position === 'FACULTY_COORDINATOR' && user.role !== 'FACULTY_ADMIN') {
      return res.status(400).json({ success: false, message: 'Only an actual faculty admin account can be assigned as Faculty Coordinator.' });
    }
    const membership = await ClubMembership.create({ clubId: req.params.clubId, userId: user._id, position });
    res.status(201).json({ success: true, membership: { ...membership.toObject(), userId: { _id: user._id, name: user.name } } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const team = await Team.create({ clubId: req.params.clubId, name: req.body.name });
    await TeamMembership.create({ teamId: team._id, userId: req.user._id, role: 'HEAD', status: 'ACCEPTED' });
    res.status(201).json({ success: true, team });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.addTeamMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No user found with that email.' });

    const existing = await TeamMembership.findOne({ teamId: req.params.teamId, userId: user._id });
    if (existing) return res.status(400).json({ success: false, message: 'This person has already been invited or is on the team.' });

    const membership = await TeamMembership.create({ teamId: req.params.teamId, userId: user._id, role: role || 'MEMBER', status: 'PENDING' });
    res.status(201).json({ success: true, membership: { ...membership.toObject(), userId: { _id: user._id, name: user.name } } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.listMyPendingTeamInvites = async (req, res) => {
  try {
    const invites = await TeamMembership.find({ userId: req.user._id, status: 'PENDING' }).populate('teamId', 'name');
    res.status(200).json({ success: true, invites });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.respondToTeamInvite = async (req, res) => {
  try {
    const { accept } = req.body;
    const membership = await TeamMembership.findOne({ _id: req.params.membershipId, userId: req.user._id, status: 'PENDING' });
    if (!membership) return res.status(404).json({ success: false, message: 'No pending invite found.' });

    membership.status = accept ? 'ACCEPTED' : 'DECLINED';
    await membership.save();
    res.status(200).json({ success: true, membership });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getClubHierarchy = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found.' });

    const coordinators = await ClubMembership.find({ clubId }).populate('userId', 'name email');
    const teams = await Team.find({ clubId });
    const teamMemberships = await TeamMembership.find({ teamId: { $in: teams.map((t) => t._id) }, status: 'ACCEPTED' }).populate('userId', 'name email');

    const teamsWithMembers = teams.map((team) => ({
      _id: team._id,
      name: team.name,
      members: teamMemberships.filter((tm) => String(tm.teamId) === String(team._id))
    }));

    res.status(200).json({ success: true, club, coordinators, teams: teamsWithMembers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getClubWorkloadHeatmap = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const teams = await Team.find({ clubId });
    const teamMemberships = await TeamMembership.find({ teamId: { $in: teams.map((t) => t._id) }, status: 'ACCEPTED' }).populate('userId', 'name');

    const uniqueMembers = new Map();
    teamMemberships.forEach((tm) => uniqueMembers.set(String(tm.userId._id), { userId: tm.userId._id, name: tm.userId.name }));
    const members = [...uniqueMembers.values()];

    const events = await Event.find({ clubId });
    const openTasks = await Task.find({ eventId: { $in: events.map((e) => e._id) }, status: { $ne: 'DONE' } });

    const heatmap = buildClubHeatmap(members, openTasks);
    res.status(200).json({ success: true, heatmap });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyTotalLoad = async (req, res) => {
  try {
    const userId = req.user._id;

    const openTasks = await Task.find({ assignedTo: userId, status: { $ne: 'DONE' } })
      .populate({ path: 'eventId', select: 'clubId', populate: { path: 'clubId', select: 'name' } });

    const tasksWithClub = openTasks
      .filter((t) => t.eventId && t.eventId.clubId)
      .map((t) => ({
        assignedTo: t.assignedTo,
        estimatedHours: t.estimatedHours,
        dueDate: t.dueDate,
        clubId: t.eventId.clubId._id,
        clubName: t.eventId.clubId.name
      }));

    const result = buildPersonalLoad({ userId, name: req.user.name }, tasksWithClub);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.leaveTeam = async (req, res) => {
  try {
    const membership = await TeamMembership.findOne({ teamId: req.params.teamId, userId: req.user._id });
    if (!membership) return res.status(404).json({ success: false, message: 'You are not on this team.' });

    if (membership.role === 'HEAD') {
      const otherHeads = await TeamMembership.countDocuments({ teamId: req.params.teamId, role: { $in: ['HEAD', 'CO_HEAD'] }, status: 'ACCEPTED', userId: { $ne: req.user._id } });
      if (otherHeads === 0) {
        return res.status(400).json({ success: false, message: 'You are the only head of this team - promote a co-head or member before leaving.' });
      }
    }

    await TeamMembership.findByIdAndDelete(membership._id);
    res.status(200).json({ success: true, message: 'You have left the team.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeTeamMember = async (req, res) => {
  try {
    const membership = await TeamMembership.findById(req.params.membershipId);
    if (!membership) return res.status(404).json({ success: false, message: 'Membership not found.' });

    if (String(membership.teamId) !== String(req.params.teamId)) {
      return res.status(404).json({ success: false, message: 'Membership not found in this team.' });
    }
    if (String(membership.userId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Use the leave-team action to remove yourself.' });
    }
    if (membership.role === 'HEAD') {
      const otherLeads = await TeamMembership.countDocuments({
        teamId: membership.teamId,
        userId: { $ne: membership.userId },
        role: { $in: ['HEAD', 'CO_HEAD'] },
        status: 'ACCEPTED'
      });
      if (otherLeads === 0) {
        return res.status(400).json({ success: false, message: 'This is the only team lead. Promote another member before removing them.' });
      }
    }

    await TeamMembership.findByIdAndDelete(membership._id);
    res.status(200).json({ success: true, message: 'Member removed from the team.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
