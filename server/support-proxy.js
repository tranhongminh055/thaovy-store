const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const AUTH_SECRET = process.env.AUTH_SECRET || 'change_this_secret';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';

// Simple in-memory user store and per-user sessions (for demo/testing)
// users: [{ name, email, passwordHash }]
const users = [];
// authSessions: { [email]: [ { id, device, createdAt, refreshTokenHash, lastSeen } ] }
const authSessions = {};

function generateAccessToken(user) {
  return jwt.sign({ email: user.email, name: user.name }, AUTH_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, AUTH_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Auth endpoints (simple demo implementation)
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const emailLower = email.toString().toLowerCase();
  if (users.find(u => u.email === emailLower)) return res.status(400).json({ error: 'Email already exists' });
  const passwordHash = bcrypt.hashSync(password, 8);
  users.push({ name: name || '', email: emailLower, passwordHash });
  return res.json({ success: true, message: 'Registered' });
});

app.post('/auth/login', (req, res) => {
  const { email, password, device } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const emailLower = email.toString().toLowerCase();
  const user = users.find(u => u.email === emailLower);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.passwordHash)) return res.status(400).json({ error: 'Invalid credentials' });

  const accessToken = generateAccessToken(user);
  const refreshToken = uuidv4();
  const sessionId = uuidv4();
  const refreshTokenHash = bcrypt.hashSync(refreshToken, 8);
  if (!authSessions[user.email]) authSessions[user.email] = [];
  authSessions[user.email].push({ id: sessionId, device: device || 'unknown', createdAt: Date.now(), refreshTokenHash, lastSeen: Date.now() });

  return res.json({ accessToken, refreshToken, sessionId, name: user.name || '', email: user.email });
});

app.post('/auth/refresh', (req, res) => {
  const { sessionId, refreshToken } = req.body || {};
  if (!sessionId || !refreshToken) return res.status(400).json({ error: 'Missing sessionId or refreshToken' });
  // find session across users
  for (const email of Object.keys(authSessions)) {
    const arr = authSessions[email];
    const s = arr.find(x => x.id === sessionId);
    if (s) {
      if (!bcrypt.compareSync(refreshToken, s.refreshTokenHash)) return res.status(401).json({ error: 'Invalid refresh token' });
      const user = users.find(u => u.email === email);
      if (!user) return res.status(400).json({ error: 'User not found' });
      s.lastSeen = Date.now();
      const accessToken = generateAccessToken(user);
      return res.json({ accessToken });
    }
  }
  return res.status(404).json({ error: 'Session not found' });
});

app.get('/auth/sessions', authenticate, (req, res) => {
  const email = req.user.email;
  const arr = authSessions[email] || [];
  const sanitized = arr.map(s => ({ id: s.id, device: s.device, createdAt: s.createdAt, lastSeen: s.lastSeen }));
  return res.json({ sessions: sanitized });
});

app.delete('/auth/sessions/:id', authenticate, (req, res) => {
  const email = req.user.email;
  const id = req.params.id;
  const arr = authSessions[email] || [];
  const idx = arr.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Session not found' });
  arr.splice(idx, 1);
  authSessions[email] = arr;
  return res.json({ success: true });
});

app.post('/auth/logout', authenticate, (req, res) => {
  const { sessionId } = req.body || {};
  const email = req.user.email;
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
  const arr = authSessions[email] || [];
  const idx = arr.findIndex(s => s.id === sessionId);
  if (idx !== -1) arr.splice(idx, 1);
  authSessions[email] = arr;
  return res.json({ success: true });
});

// Email config from environment
const SHOP_EMAIL = process.env.SHOP_EMAIL || 'mt1479233@gmail.com';
const APP_PASSWORD = process.env.APP_PASSWORD || 'drykneiokjyrvudm'; // Remove spaces from your app password

// In-memory storage: sessionId -> { messages: [...], lastCheck: timestamp }
const sessions = {};

// Create nodemailer transporter for sending
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SHOP_EMAIL,
    pass: APP_PASSWORD
  }
});

// IMAP config for reading emails
const imapConfig = {
  imap: {
    user: SHOP_EMAIL,
    password: APP_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  }
};

// Function to fetch unread emails via IMAP and check for replies
async function checkForNewEmails() {
  try {
    const connection = await imaps.connect(imapConfig);
    const messages = await connection.search(['UNSEEN']);
    
    if (messages.length === 0) {
      await connection.end();
      return {};
    }

    const newMessages = {};

    for (const message of messages) {
      const parts = await connection.getPart(message.attributes.uid, 'HEADER.FIELDS (FROM SUBJECT DATE)');
      const body = await connection.getPart(message.attributes.uid, 'TEXT');

      const headerText = parts.parts[0].body[0];
      const from = headerText.match(/from: (.*?)\r\n/i)?.[1] || 'Unknown';
      const subject = headerText.match(/subject: (.*?)\r\n/i)?.[1] || '';
      const date = headerText.match(/date: (.*?)\r\n/i)?.[1] || new Date().toISOString();
      const bodyText = body.parts[0].body[0] || '';

      // Extract sessionId from subject (format: "[sessionId] Message from...")
      const match = subject.match(/\[([a-f0-9\-_]+)\]/);
      if (match) {
        const sessionId = match[1];
        if (!newMessages[sessionId]) {
          newMessages[sessionId] = [];
        }
        newMessages[sessionId].push({
          from: from,
          body: bodyText,
          timestamp: new Date(date).getTime(),
          type: 'reply'
        });
      }
    }

    // Mark as read
    if (messages.length > 0) {
      const uids = messages.map(m => m.attributes.uid);
      await connection.addFlags(uids, '\\Seen');
    }

    await connection.end();
    return newMessages;
  } catch (err) {
    console.error('Error checking emails:', err);
    return {};
  }
}

// POST: Customer sends a message
app.post('/api/support/send', async (req, res) => {
  try {
    const { sessionId, customerEmail, customerName, message } = req.body;

    if (!sessionId || !customerEmail || !message) {
      return res.status(400).json({ error: 'Missing required fields: sessionId, customerEmail, message' });
    }

    // Initialize session if not exists
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        messages: [],
        customerEmail,
        customerName: customerName || 'Customer',
        createdAt: new Date().getTime()
      };
    }

    // Add message to session
    sessions[sessionId].messages.push({
      from: 'customer',
      body: message,
      timestamp: new Date().getTime(),
      type: 'sent'
    });

    // Send email to shop
    const subject = `[${sessionId}] Message from ${customerName || customerEmail}`;
    const emailBody = `
Customer: ${customerName || customerEmail} (${customerEmail})
Message: ${message}

---
Session ID: ${sessionId}
Reply using the same format to respond.
    `;

    await transporter.sendMail({
      from: SHOP_EMAIL,
      to: SHOP_EMAIL,
      subject: subject,
      text: emailBody
    });

    return res.json({
      success: true,
      sessionId: sessionId,
      message: 'Message sent to shop'
    });
  } catch (err) {
    console.error('Send email error:', err);
    return res.status(500).json({ error: 'Failed to send email: ' + err.message });
  }
});

// GET: Fetch all messages for a session
app.get('/api/support/messages/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessions[sessionId]) {
      return res.json({ messages: [], sessionId });
    }

    // Check for new emails periodically (every 5 seconds max)
    const now = new Date().getTime();
    const lastCheck = sessions[sessionId].lastCheck || 0;

    if (now - lastCheck > 5000) {
      sessions[sessionId].lastCheck = now;
      try {
        const newEmails = await checkForNewEmails();
        if (newEmails[sessionId]) {
          sessions[sessionId].messages.push(...newEmails[sessionId]);
        }
      } catch (err) {
        console.error('Error checking emails:', err);
        // Continue anyway, don't fail the request
      }
    }

    // Sort messages by timestamp
    const messages = sessions[sessionId].messages.sort((a, b) => a.timestamp - b.timestamp);

    return res.json({
      sessionId,
      messages,
      customerEmail: sessions[sessionId].customerEmail,
      customerName: sessions[sessionId].customerName
    });
  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages: ' + err.message });
  }
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'email-support',
    shopEmail: SHOP_EMAIL,
    port: PORT
  });
});

// Root endpoint - helpful message for browser
app.get('/', (req, res) => {
  res.send('Service running. Use /health for JSON status or API endpoints under /auth and /api.');
});

app.listen(PORT, () => {
  console.log(`Email support proxy listening on http://localhost:${PORT}`);
  console.log(`Shop email: ${SHOP_EMAIL}`);
});
