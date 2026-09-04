const express = require('express');
const {
  createTask, listTasks, updateTaskStatus, suggestAssignment,
  assignTask, getMemberConflicts, getMyTasks, updateTask, deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { requireEventMember, requireEventMemberForTask } = require('../middleware/authorize');
const router = express.Router();

router.use(protect);
router.get('/mine', getMyTasks);
router.get('/:eventId', requireEventMember, listTasks);
router.post('/:eventId', requireEventMember, createTask);
router.get('/:eventId/suggest-assignee', requireEventMember, suggestAssignment);
router.get('/:eventId/conflicts/:userId', requireEventMember, getMemberConflicts);
router.patch('/item/:taskId', requireEventMemberForTask, updateTask);
router.delete('/item/:taskId', requireEventMemberForTask, deleteTask);
router.patch('/item/:taskId/status', requireEventMemberForTask, updateTaskStatus);
router.patch('/item/:taskId/assign', requireEventMemberForTask, assignTask);

module.exports = router;
