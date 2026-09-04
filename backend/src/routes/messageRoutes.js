const express = require('express');
const { listMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { requireChannelMember } = require('../middleware/authorize');
const router = express.Router();

router.use(protect);
router.get('/:channelType/:channelId', requireChannelMember, listMessages);
router.post('/:channelType/:channelId', requireChannelMember, sendMessage);

module.exports = router;
