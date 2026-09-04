const express = require('express');
const { listActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');
const { requireEventMember } = require('../middleware/authorize');
const router = express.Router();

router.use(protect);
router.get('/:eventId', requireEventMember, listActivity);

module.exports = router;
