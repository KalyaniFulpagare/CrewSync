const Comment = require('../models/Comment');
const logActivity = require('../utils/logActivity');

exports.addComment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const comment = await Comment.create({ eventId, userId: req.user._id, text: req.body.text });
    const populated = await comment.populate('userId', 'name');

    const io = req.app.get('io');
    if (io) io.to(`event_${eventId}`).emit('comment_added', populated);

    res.status(201).json({ success: true, comment: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.listComments = async (req, res) => {
  try {
    const comments = await Comment.find({ eventId: req.params.eventId }).populate('userId', 'name').sort({ createdAt: 1 });
    res.status(200).json({ success: true, comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
