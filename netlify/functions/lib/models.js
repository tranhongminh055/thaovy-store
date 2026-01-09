const mongoose = require('mongoose');

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true, required: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Session schema
const sessionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  sessionId: { type: String, unique: true, required: true },
  device: { type: String, default: 'unknown' },
  refreshTokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);

module.exports = { User, Session };
