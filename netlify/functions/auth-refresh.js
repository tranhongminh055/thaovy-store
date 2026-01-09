const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./lib/db');

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
    const { sessionId, refreshToken } = JSON.parse(event.body) || {};
    if (!sessionId || !refreshToken) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing sessionId or refreshToken' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
    }

    for (const email of Object.keys(db.sessions)) {
      const arr = db.sessions[email];
      const s = arr.find(x => x.id === sessionId);
      if (s) {
        if (!bcrypt.compareSync(refreshToken, s.refreshTokenHash)) {
          return { statusCode: 401, body: JSON.stringify({ error: 'Invalid refresh token' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
        }
        const user = db.users.find(u => u.email === email);
        if (!user) {
          return { statusCode: 400, body: JSON.stringify({ error: 'User not found' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
        }
        s.lastSeen = Date.now();
        const accessToken = generateAccessToken(user);
        return { statusCode: 200, body: JSON.stringify({ accessToken }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
      }
    }
    return { statusCode: 404, body: JSON.stringify({ error: 'Session not found' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
  }
};
