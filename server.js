
require('dotenv').config({ path: '.env.local' });
const { clerkMiddleware, getAuth } = require('@clerk/express');
const express = require('express');
const cors = require('cors');
const { Pool } = require('@neondatabase/serverless');

const app = express();

app.use(clerkMiddleware());
app.use(cors({ origin: 'http://localhost:5174' }));
app.use(express.json());

const requireSignedIn = (req, res, next) => {
  const { isAuthenticated } = getAuth(req);

  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/', (req, res) => {
  res.send('My backend is running!');
});

app.get('/api/subscriptions', requireSignedIn, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscriptions ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

app.get('/api/db-test', requireSignedIn, async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS database_time');
    res.json({ databaseTime: result.rows[0].database_time });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
