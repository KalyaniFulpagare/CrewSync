const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  eventDate: { type: Date, required: true },
  venue: { type: String, default: '' },
  budget: { type: Number, default: 0 },
  status: { type: String, enum: ['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED'], default: 'PLANNED' },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
