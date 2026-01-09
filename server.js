const express = require('express');
const path = require('path');
const cors = require('cors');
const { connectDB, initializeDefaultUsers } = require('./netlify/functions/lib/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Import auth handlers
const authLoginHandler = require('./netlify/functions/auth-login').handler;
const authRegisterHandler = require('./netlify/functions/auth-register').handler;
const authLogoutHandler = require('./netlify/functions/auth-logout').handler;
const authRefreshHandler = require('./netlify/functions/auth-refresh').handler;
const authSessionsHandler = require('./netlify/functions/auth-sessions').handler;
const supportSendHandler = require('./netlify/functions/support-send').handler;
const supportMessagesHandler = require('./netlify/functions/support-messages').handler;

// Connect to MongoDB on startup
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// API Routes - wrap Netlify Functions
app.post('/api/auth/login', async (req, res) => {
  try {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body)
    };
    const response = await authLoginHandler(event, {});
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body)
    };
    const response = await authRegisterHandler(event, {});
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body)
    };
    const response = await authLogoutHandler(event, {});
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body)
    };
    const response = await authRefreshHandler(event, {});
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/sessions', async (req, res) => {
  try {
    const event = {
      httpMethod: 'GET',
      headers: req.headers
    };
    const response = await authSessionsHandler(event, {});
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/support/send', async (req, res) => {
  try {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body)
    };
    const response = await supportSendHandler(event, {});
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/support/messages', async (req, res) => {
  try {
    const event = {
      httpMethod: 'GET',
      headers: req.headers
    };
    const response = await supportMessagesHandler(event, {});
    res.status(response.statusCode).json(JSON.parse(response.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
