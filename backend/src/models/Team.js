const mongoose = require('mongoose');

// A standing team within a club (Design, PR, Technical, Content, Event
// Management, ...) — created once, reused across every event the club runs.
const teamSchema = new mongoose.Schema({
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  name: { type: String, required: true, trim: true }
}, { timestamps: true });

teamSchema.index({ clubId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);
