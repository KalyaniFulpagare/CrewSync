const ActivityLog = require('../models/ActivityLog');

exports.listActivity = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ eventId: req.params.eventId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
