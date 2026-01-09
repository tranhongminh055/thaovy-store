const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mt1479233_db_user:minhtran055@cluster0.qoy22yq.mongodb.net/thaovy_store?retryWrites=true&w=majority';

let isConnected = false;

// Connect to MongoDB
async function connectDB() {
  if (isConnected) return;
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

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

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

// Initialize default users if collection is empty
async function initializeDefaultUsers() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      await User.create([
        {
          email: 'minhbabycute8386@gmail.com',
          name: 'Minh',
          passwordHash: bcrypt.hashSync('123456', 8)
        },
        {
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: bcrypt.hashSync('password', 8)
        }
      ]);
      console.log('Default users created');
    }
  } catch (error) {
    console.error('Error initializing users:', error);
  }
}

module.exports = { connectDB, User, Session, initializeDefaultUsers };

