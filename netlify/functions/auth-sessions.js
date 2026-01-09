const jwt = require('jsonwebtoken');
const db = require('./lib/db');

const AUTH_SECRET = process.env.AUTH_SECRET || 'change_this_secret';

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
  }

  try {
    const auth = event.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Missing token' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
    }
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, AUTH_SECRET);

    const email = payload.email;
    const arr = db.sessions[email] || [];
    const sanitized = arr.map(s => ({ id: s.id, device: s.device, createdAt: s.createdAt, lastSeen: s.lastSeen }));
    return { statusCode: 200, body: JSON.stringify({ sessions: sanitized }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
  }
};
