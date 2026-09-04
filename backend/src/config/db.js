const mongoose = require('mongoose');

const connectDB = async (uri) => {
  await mongoose.connect(uri || process.env.MONGO_URI);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};

module.exports = connectDB;
