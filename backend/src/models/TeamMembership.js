const mongoose = require('mongoose');

const teamMembershipSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['HEAD', 'CO_HEAD', 'MEMBER'], default: 'MEMBER' },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'DECLINED'], default: 'PENDING' }
}, { timestamps: true });

teamMembershipSchema.index({ teamId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('TeamMembership', teamMembershipSchema);
