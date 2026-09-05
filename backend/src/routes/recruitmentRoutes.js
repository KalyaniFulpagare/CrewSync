const express = require('express');
const {
  createDrive, listOpenDrives, listClubDrives, getDrive, updateDriveStatus,
  applyToDrive, listMyApplications, listDriveApplications, updateApplicationStatus
} = require('../controllers/recruitmentController');
const { protect } = require('../middleware/auth');
const { requireClubCoordinator, requireDriveCoordinator } = require('../middleware/authorize');
const router = express.Router();

router.use(protect);

router.get('/drives', listOpenDrives);
router.get('/drives/:driveId', getDrive);
router.post('/drives/:driveId/apply', applyToDrive);
router.get('/my-applications', listMyApplications);

router.post('/clubs/:clubId/drives', requireClubCoordinator, createDrive);
router.get('/clubs/:clubId/drives', requireClubCoordinator, listClubDrives);
router.patch('/drives/:driveId/status', requireDriveCoordinator, updateDriveStatus);
router.get('/drives/:driveId/applications', requireDriveCoordinator, listDriveApplications);
router.patch('/drives/:driveId/applications/:applicationId/status', requireDriveCoordinator, updateApplicationStatus);

module.exports = router;
