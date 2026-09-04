const Message = require('../models/Message');

exports.listMessages = async (req, res) => {
  try {
    const { channelType, channelId } = req.params;
    const messages = await Message.find({ channelType: channelType.toUpperCase(), channelId })
      .populate('userId', 'name')
      .sort({ createdAt: 1 })
      .limit(100);
    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { channelType, channelId } = req.params;
    const message = await Message.create({ channelType: channelType.toUpperCase(), channelId, userId: req.user._id, text: req.body.text });
    const populated = await message.populate('userId', 'name');

    const io = req.app.get('io');
    const room = `${channelType.toLowerCase()}_${channelId}`;
    if (io) io.to(room).emit('hub_message', populated);

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
