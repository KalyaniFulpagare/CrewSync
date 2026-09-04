const express = require('express');
const { addComment, listComments } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { requireEventMember } = require('../middleware/authorize');
const router = express.Router();

router.use(protect);
router.get('/:eventId', requireEventMember, listComments);
router.post('/:eventId', requireEventMember, addComment);

module.exports = router;
