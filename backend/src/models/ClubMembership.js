const mongoose = require('mongoose');

// Club-level positions that sit above any single team — the people who
// oversee the whole club, not one specific team's work.
const clubMembershipSchema = new mongoose.Schema({
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  position: {
    type: String,
    enum: ['FACULTY_COORDINATOR', 'HEAD_COORDINATOR', 'JOINT_HEAD_COORDINATOR'],
    required: true
  }
}, { timestamps: true });

clubMembershipSchema.index({ clubId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ClubMembership', clubMembershipSchema);
