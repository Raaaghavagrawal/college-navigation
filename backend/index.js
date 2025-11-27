import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 4000;

// Log connection configuration
const dbConfig = {
  host: process.env.DB_HOST || '192.168.0.241',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'raghav23@',
  database: process.env.DB_NAME || 'bhhraman',
  port: parseInt(process.env.DB_PORT) || 3306,
  connectTimeout: 10000, // 10 seconds timeout for remote connections
  waitForConnections: true,
  connectionLimit: 10,
};

console.log('📊 Database Configuration:');
console.log(`  Host: ${dbConfig.host}`);
console.log(`  User: ${dbConfig.user}`);
console.log(`  Database: ${dbConfig.database}`);
console.log(`  Port: ${dbConfig.port}\n`);

const pool = mysql.createPool(dbConfig);

// Test database connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    console.error('Current connection settings:');
    console.error(`  Host: ${process.env.DB_HOST || 'localhost'}`);
    console.error(`  User: ${process.env.DB_USER || 'root'}`);
    console.error(`  Database: ${process.env.DB_NAME || 'bhhraman'}`);
    console.error('\nPlease check:');
    console.error('1. MySQL server is running on the remote device');
    console.error('2. Remote MySQL allows connections (bind-address configured)');
    console.error('3. Database "bhhraman" exists');
    console.error('4. User credentials are correct');
    console.error('5. Firewall allows port 3306');
    console.error('6. Both devices are on the same network');
    console.error('\nTo connect to remote database, set DB_HOST environment variable:');
    console.error('  Windows PowerShell: $env:DB_HOST="192.168.0.112"; node index.js');
    console.error('  Or create a .env file with: DB_HOST=192.168.0.112');
  });

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n📥 ${req.method} ${req.path}`);
  if (Object.keys(req.body || {}).length > 0) {
    console.log('   Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoint (doesn't require database)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// This endpoint now just records the user's details and lets them in.
// It does NOT verify against existing credentials.
app.post('/api/login', async (req, res) => {
  console.log('🔐 Login attempt received');
  try {
    const { email, password, phone } = req.body || {};
    console.log(`   Email: ${email}, Phone: ${phone || 'not provided'}`);

    if (!email) {
      console.log('   ❌ Email missing');
      return res.status(400).json({ message: 'Email is required.' });
    }

    try {
      console.log('   💾 Attempting to insert user into database...');
      console.log(`   🔗 Using database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

      // Try to create a new user entry whenever someone enters the app
      const [result] = await pool.query(
        'INSERT INTO users (email, password_hash, phone) VALUES (?, ?, ?)',
        [email, password || null, phone || null],
      );

      console.log(`   ✅ User inserted successfully (ID: ${result.insertId})`);
      return res.json({
        message: 'Entry successful',
        user: { id: result.insertId, email, phone: phone || null },
      });
    } catch (err) {
      console.log(`   ⚠️  Insert failed: ${err.code} - ${err.message}`);
      // If the email already exists, just fetch that user and let them in
      if (err && err.code === 'ER_DUP_ENTRY') {
        try {
          const [rows] = await pool.query(
            'SELECT id, email, phone FROM users WHERE email = ?',
            [email],
          );

          if (rows.length) {
            const user = rows[0];
            return res.json({
              message: 'Entry successful',
              user: { id: user.id, email: user.email, phone: phone || user.phone },
            });
          }
        } catch (innerErr) {
          console.error('Error fetching existing user after duplicate entry:', innerErr);
          return res.status(500).json({
            message: 'Database error while fetching user.',
            error: innerErr.message,
            code: innerErr.code,
            sqlMessage: innerErr.sqlMessage
          });
        }
      }

      // Log all error details
      console.error('❌ Database error in /api/login:');
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      console.error('SQL Message:', err.sqlMessage);
      console.error('Full error:', err);

      // Return detailed error for debugging
      return res.status(500).json({
        message: 'Database error. Please check server logs.',
        error: err.message,
        code: err.code,
        sqlMessage: err.sqlMessage,
        hint: err.code === 'ER_ACCESS_DENIED_ERROR'
          ? 'Check MySQL username and password in index.js'
          : err.code === 'ER_BAD_DB_ERROR'
            ? 'Database "bhhraman" does not exist. Run setup.sql to create it.'
            : err.code === 'ER_NO_SUCH_TABLE'
              ? 'Table "users" does not exist. Run setup.sql to create it.'
              : 'Check server console for details'
      });
    }
  } catch (unexpectedErr) {
    console.error('❌ Unexpected error in /api/login:', unexpectedErr);
    return res.status(500).json({
      message: 'Unexpected server error.',
      error: unexpectedErr.message
    });
  }
});

// Store feedback stars in the database
app.post('/api/feedback', async (req, res) => {
  const { email, rating } = req.body || {};

  if (!email || typeof rating !== 'number') {
    return res.status(400).json({ message: 'Email and numeric rating are required.' });
  }

  try {
    await pool.query('INSERT INTO feedback (email, rating) VALUES (?, ?)', [email, rating]);
    return res.json({ message: 'Feedback saved.' });
  } catch (err) {
    console.error('Error saving feedback:', err);
    return res.status(500).json({ message: 'Server error while saving feedback.' });
  }
});

// Global error handler for unhandled errors
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle 404
app.use((req, res) => {
  console.log(`⚠️  404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Auth API running on port ${PORT}`);
  console.log(`📡 Accessible via:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://192.168.0.241:${PORT}`);
  console.log(`\n📡 Ready to accept connections\n`);
});
