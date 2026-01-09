const nodemailer = require('nodemailer');

// Email config from environment variables (set in Netlify)
const SHOP_EMAIL = process.env.SHOP_EMAIL || 'mt1479233@gmail.com';
const APP_PASSWORD = process.env.APP_PASSWORD || 'drykneiokjyrvudm';

// In-memory storage (note: resets on each deploy, use for testing)
const sessions = {};

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SHOP_EMAIL,
    pass: APP_PASSWORD
  }
});

exports.handler = async (event, context) => {
  // Allow CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const { sessionId, customerEmail, customerName, message } = JSON.parse(event.body || '{}');

    if (!sessionId || !customerEmail || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: sessionId, customerEmail, message' })
      };
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
    const emailBody = `Customer: ${customerName || customerEmail} (${customerEmail})
Message: ${message}

---
Session ID: ${sessionId}
Để trả lời, reply email này với subject giữ nguyên.`;

    await transporter.sendMail({
      from: SHOP_EMAIL,
      to: SHOP_EMAIL,
      subject: subject,
      text: emailBody
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sessionId,
        message: 'Tin nhắn đã gửi tới shop'
      })
    };
  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to send message: ' + err.message })
    };
  }
};
