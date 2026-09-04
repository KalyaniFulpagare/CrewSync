const Task = require('../models/Task');
const EventMember = require('../models/EventMember');
const Event = require('../models/Event');
const Team = require('../models/Team');
const logActivity = require('../utils/logActivity');
const { suggestAssignee } = require('../utils/workloadAssignment');
const { detectConflicts } = require('../utils/conflictDetector');

exports.createTask = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { teamId, dependsOn } = req.body;

    if (teamId) {
      const [event, team] = await Promise.all([Event.findById(eventId), Team.findById(teamId)]);
      if (!event || !team || String(team.clubId) !== String(event.clubId)) {
        return res.status(400).json({ success: false, message: 'A task team must belong to this event\'s club.' });
      }
    }

    if (dependsOn && dependsOn.length > 0) {
      const dependencyTasks = await Task.find({ _id: { $in: dependsOn } });
      if (dependencyTasks.length !== dependsOn.length) {
        return res.status(400).json({ success: false, message: 'One or more dependency tasks do not exist.' });
      }
      const wrongEvent = dependencyTasks.some((t) => String(t.eventId) !== String(eventId));
      if (wrongEvent) {
        return res.status(400).json({ success: false, message: 'A task can only depend on other tasks within the same event.' });
      }
    }

    const task = await Task.create({ ...req.body, eventId, teamId: teamId || null, createdBy: req.user._id });
    await logActivity(eventId, req.user._id, 'TASK_CREATED', { title: task.title }, req.app.get('io'));
    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.listTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ eventId: req.params.eventId })
      .populate('assignedTo', 'name email')
      .populate('teamId', 'name');
    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, expectedVersion } = req.body;

    if (!['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid task status.' });
    }

    const existingTask = await Task.findById(req.params.taskId).select('dependsOn');
    if (!existingTask) return res.status(404).json({ success: false, message: 'Task not found.' });
    const dependencies = existingTask.dependsOn || [];
    if (['IN_PROGRESS', 'DONE'].includes(status) && dependencies.length > 0) {
      const incompleteDependencies = await Task.countDocuments({ _id: { $in: dependencies }, status: { $ne: 'DONE' } });
      if (incompleteDependencies > 0) {
        return res.status(400).json({ success: false, message: 'Complete this task\'s dependencies before starting or completing it.' });
      }
    }

    const query = { _id: req.params.taskId };
    if (expectedVersion !== undefined) query.__v = expectedVersion;

    const task = await Task.findOneAndUpdate(query, { $set: { status }, $inc: { __v: 1 } }, { new: true });

    if (!task) {
      const currentTask = await Task.findById(req.params.taskId);
      if (!currentTask) return res.status(404).json({ success: false, message: 'Task not found.' });
      return res.status(409).json({
        success: false,
        message: 'This task was updated by someone else just now — refresh to see the latest version.',
        currentTask
      });
    }

    await logActivity(task.eventId, req.user._id, 'TASK_STATUS_CHANGED', { title: task.title, status }, req.app.get('io'));
    res.status(200).json({ success: true, task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.suggestAssignment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const members = await EventMember.find({ eventId, status: 'ACCEPTED' }).populate('userId', 'name');
    const openTasks = await Task.find({ eventId, status: { $ne: 'DONE' } });

    const memberList = members.map((m) => ({ userId: m.userId._id, name: m.userId.name }));
    const ranking = suggestAssignee(memberList, openTasks);

    res.status(200).json({ success: true, ranking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignTask = async (req, res) => {
  try {
    const { userId } = req.body;
    const existingTask = await Task.findById(req.params.taskId);
    if (!existingTask) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (userId) {
      const membership = await EventMember.findOne({ eventId: existingTask.eventId, userId, status: 'ACCEPTED' });
      if (!membership) return res.status(400).json({ success: false, message: 'Tasks can only be assigned to accepted event members.' });
    }

    const task = await Task.findByIdAndUpdate(req.params.taskId, { assignedTo: userId || null }, { new: true }).populate('assignedTo', 'name email');
    await logActivity(task.eventId, req.user._id, 'TASK_ASSIGNED', { title: task.title, assignee: task.assignedTo?.name }, req.app.get('io'));
    res.status(200).json({ success: true, task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMemberConflicts = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const tasks = await Task.find({ eventId, assignedTo: userId });
    const conflicts = detectConflicts(tasks);
    res.status(200).json({ success: true, conflicts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id }).populate('eventId', 'title clubId eventDate').sort({ dueDate: 1 });
    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const allowedFields = ['title', 'description', 'dueDate', 'estimatedHours', 'teamId'];
    const updates = {};
    allowedFields.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    if (updates.teamId) {
      const [existingTask, team] = await Promise.all([Task.findById(req.params.taskId), Team.findById(updates.teamId)]);
      if (!existingTask) return res.status(404).json({ success: false, message: 'Task not found.' });
      const event = await Event.findById(existingTask.eventId);
      if (!team || !event || String(team.clubId) !== String(event.clubId)) {
        return res.status(400).json({ success: false, message: 'A task team must belong to this event\'s club.' });
      }
    }

    const task = await Task.findByIdAndUpdate(req.params.taskId, updates, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    await logActivity(task.eventId, req.user._id, 'TASK_EDITED', { title: task.title }, req.app.get('io'));
    res.status(200).json({ success: true, task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const dependents = await Task.find({ dependsOn: task._id });
    if (dependents.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Can't delete this task — ${dependents.map((d) => d.title).join(', ')} depends on it. Remove that dependency first.`
      });
    }

    await Task.findByIdAndDelete(req.params.taskId);
    await logActivity(task.eventId, req.user._id, 'TASK_DELETED', { title: task.title }, req.app.get('io'));
    res.status(200).json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

