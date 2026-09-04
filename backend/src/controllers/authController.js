const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'An account with this email already exists.' });

    const user = await User.create({ name, email, password });
    res.status(201).json({ success: true, token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    res.status(200).json({ success: true, token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json({ success: true, user: { id: req.user._id, name: req.user.name, email: req.user.email } });
};

exports.searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(200).json({ success: true, users: [] });
  const users = await User.find({ email: new RegExp(q, 'i') }).limit(8).select('name email');
  res.status(200).json({ success: true, users });
};
