const ActivityLog = require('../models/ActivityLog');

// Central place every controller calls after a meaningful action, so the
// activity feed (and the at-risk "days since last activity" signal) stays
// accurate without each controller re-implementing logging.
async function logActivity(eventId, userId, action, meta = {}, io = null) {
  const entry = await ActivityLog.create({ eventId, userId, action, meta });
  if (io) {
    const populated = await entry.populate('userId', 'name');
    io.to(`event_${eventId}`).emit('activity_logged', populated);
  }
  return entry;
}

module.exports = logActivity;
