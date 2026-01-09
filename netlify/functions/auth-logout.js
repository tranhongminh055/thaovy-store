const jwt = require('jsonwebtoken');
const db = require('./lib/db');

const AUTH_SECRET = process.env.AUTH_SECRET || 'change_this_secret';

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, DELETE' } };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
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
    const sessionId = event.httpMethod === 'DELETE' ? event.path.split('/').pop() : (JSON.parse(event.body || '{}').sessionId);
    
    if (!sessionId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing sessionId' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
    }

    const arr = db.sessions[email] || [];
    const idx = arr.findIndex(s => s.id === sessionId);
    if (idx === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Session not found' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
    }
    arr.splice(idx, 1);
    db.sessions[email] = arr;

    return { statusCode: 200, body: JSON.stringify({ success: true }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }), headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } };
  }
};
