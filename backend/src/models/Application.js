const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionLabel: { type: String, required: true },
  value: { type: String, default: '' }
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruitmentDrive', required: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  answers: [answerSchema],
  status: {
    type: String,
    enum: ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'],
    default: 'APPLIED'
  }
}, { timestamps: true });

applicationSchema.index({ driveId: 1, applicantId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
