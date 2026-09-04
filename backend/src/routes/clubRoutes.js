const express = require('express');
const {
  createClub, listMyClubs, addClubCoordinator, createTeam,
  addTeamMember, getClubHierarchy, getClubWorkloadHeatmap, getMyTotalLoad,
  listMyPendingTeamInvites, respondToTeamInvite, leaveTeam, removeTeamMember
} = require('../controllers/clubController');
const { listEventsByClub } = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { requireClubCoordinator, requireTeamHeadOrCoordinator, requireClubMemberOrCoordinator, requireClubCoordinatorOrTeamLead } = require('../middleware/authorize');
const router = express.Router();

router.use(protect);
router.get('/', listMyClubs);
router.get('/my-load', getMyTotalLoad);
router.get('/invites/pending', listMyPendingTeamInvites);
router.patch('/invites/:membershipId/respond', respondToTeamInvite);
router.post('/', createClub);
router.get('/:clubId/hierarchy', requireClubMemberOrCoordinator, getClubHierarchy);
router.get('/:clubId/heatmap', requireClubCoordinatorOrTeamLead, getClubWorkloadHeatmap);
router.get('/:clubId/events', requireClubMemberOrCoordinator, listEventsByClub);
router.post('/:clubId/coordinators', requireClubCoordinator, addClubCoordinator);
router.post('/:clubId/teams', requireClubCoordinator, createTeam);
router.post('/teams/:teamId/members', requireTeamHeadOrCoordinator, addTeamMember);
router.post('/teams/:teamId/leave', leaveTeam);
router.delete('/teams/:teamId/members/:membershipId', requireTeamHeadOrCoordinator, removeTeamMember);

module.exports = router;
