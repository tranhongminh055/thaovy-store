const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { connectDB, User, Session, initializeDefaultUsers } = require('./lib/db');

const AUTH_SECRET = process.env.AUTH_SECRET || 'change_this_secret';
const ACCESS_TOKEN_EXPIRES_IN = '15m';

function generateAccessToken(user) {
  return jwt.sign({ email: user.email, name: user.name }, AUTH_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
  }

  try {
    await connectDB();
    await initializeDefaultUsers();

    const { email, password, device } = JSON.parse(event.body) || {};
    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing email or password' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
    }

    const emailLower = email.toString().toLowerCase();
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid credentials' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
    }
    if (!bcrypt.compareSync(password, user.passwordHash)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid credentials' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = uuidv4();
    const sessionId = uuidv4();
    const refreshTokenHash = bcrypt.hashSync(refreshToken, 8);
    
    await Session.create({
      email: user.email,
      sessionId,
      device: device || 'unknown',
      refreshTokenHash
    });

    return { 
      statusCode: 200, 
      body: JSON.stringify({ accessToken, refreshToken, sessionId, name: user.name || '', email: user.email }),
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    };
  } catch (err) {
    console.error('Login error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
  }
};

