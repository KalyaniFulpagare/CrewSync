const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  type: { type: String, enum: ['TEXT', 'TEXTAREA', 'SELECT'], default: 'TEXT' },
  options: [{ type: String, trim: true }],
  required: { type: Boolean, default: true }
}, { _id: false });

const recruitmentDriveSchema = new mongoose.Schema({
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true }],
  questions: [questionSchema],
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  closesAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('RecruitmentDrive', recruitmentDriveSchema);
