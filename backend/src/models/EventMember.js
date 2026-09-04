const mongoose = require('mongoose');

const eventMemberSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['HEAD', 'MEMBER'], default: 'MEMBER' },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'DECLINED'], default: 'PENDING' }
}, { timestamps: true });

eventMemberSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('EventMember', eventMemberSchema);
