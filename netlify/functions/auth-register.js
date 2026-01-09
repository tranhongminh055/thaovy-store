const bcrypt = require('bcryptjs');
const { connectDB, User, initializeDefaultUsers } = require('./lib/db');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }), headers: { 'Content-Type': 'application/json' } };
  }

  try {
    await connectDB();
    await initializeDefaultUsers();

    const { name, email, password } = JSON.parse(event.body) || {};
    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing email or password' }), headers: { 'Content-Type': 'application/json' } };
    }

    const emailLower = email.toString().toLowerCase();
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email already exists' }), headers: { 'Content-Type': 'application/json' } };
    }

    const passwordHash = bcrypt.hashSync(password, 8);
    await User.create({ name: name || '', email: emailLower, passwordHash });

    return { 
      statusCode: 200, 
      body: JSON.stringify({ success: true, message: 'Registered' }),
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    };
  } catch (err) {
    console.error('Register error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }), headers: { 'Content-Type': 'application/json' } };
  }
};

