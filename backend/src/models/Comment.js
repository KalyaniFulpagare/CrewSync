const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true }
}, { timestamps: true });

commentSchema.index({ eventId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
