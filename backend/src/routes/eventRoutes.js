const express = require('express');
const {
  createEvent, listMyEvents, getEvent, inviteMember, getEventInsights, listEventsByClub,
  listMyPendingEventInvites, respondToEventInvite, updateEvent, deleteEvent,
  leaveEvent, removeEventMember
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { requireEventMember, requireClubMemberOrCoordinator, requireEventHost } = require('../middleware/authorize');
const router = express.Router();

router.use(protect);
router.get('/', listMyEvents);
router.get('/invites/pending', listMyPendingEventInvites);
router.post('/', requireClubMemberOrCoordinator, createEvent);
router.get('/:id', requireEventMember, getEvent);
router.patch('/:id', requireEventMember, requireEventHost, updateEvent);
router.delete('/:id', requireEventMember, deleteEvent);
router.post('/:id/invite', requireEventMember, requireEventHost, inviteMember);
router.post('/:id/leave', requireEventMember, leaveEvent);
router.delete('/:id/members/:membershipId', requireEventMember, removeEventMember);
router.get('/:id/insights', requireEventMember, getEventInsights);
router.patch('/invites/:membershipId/respond', respondToEventInvite);

module.exports = router;
