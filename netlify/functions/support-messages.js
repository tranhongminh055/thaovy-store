const imaps = require('imap-simple');

const SHOP_EMAIL = process.env.SHOP_EMAIL || 'mt1479233@gmail.com';
const APP_PASSWORD = process.env.APP_PASSWORD || 'drykneiokjyrvudm';

// In-memory storage
const sessions = {};

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
      try {
        const parts = await connection.getPart(message.attributes.uid, 'HEADER.FIELDS (FROM SUBJECT DATE)');
        const body = await connection.getPart(message.attributes.uid, 'TEXT');

        const headerText = parts.parts[0].body[0] || '';
        const from = headerText.match(/from: (.*?)\r\n/i)?.[1] || 'Unknown';
        const subject = headerText.match(/subject: (.*?)\r\n/i)?.[1] || '';
        const date = headerText.match(/date: (.*?)\r\n/i)?.[1] || new Date().toISOString();
        const bodyText = body.parts?.[0]?.body?.[0] || '';

        // Extract sessionId from subject
        const match = subject.match(/\[([a-f0-9\-_]+)\]/);
        if (match) {
          const sessionId = match[1];
          if (!newMessages[sessionId]) {
            newMessages[sessionId] = [];
          }
          newMessages[sessionId].push({
            from,
            body: bodyText,
            timestamp: new Date(date).getTime(),
            type: 'reply'
          });
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    }

    // Mark as read
    if (messages.length > 0) {
      try {
        const uids = messages.map(m => m.attributes.uid);
        await connection.addFlags(uids, '\\Seen');
      } catch (e) {
        console.error('Error marking as read:', e);
      }
    }

    await connection.end();
    return newMessages;
  } catch (err) {
    console.error('IMAP error:', err);
    return {};
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const sessionId = event.path.split('/').pop();

    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing sessionId' })
      };
    }

    // Check for new emails
    const newEmails = await checkForNewEmails();

    if (!sessions[sessionId]) {
      sessions[sessionId] = { messages: [] };
    }

    if (newEmails[sessionId]) {
      sessions[sessionId].messages.push(...newEmails[sessionId]);
    }

    const messages = sessions[sessionId].messages.sort((a, b) => a.timestamp - b.timestamp);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId,
        messages
      })
    };
  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch messages: ' + err.message })
    };
  }
};
