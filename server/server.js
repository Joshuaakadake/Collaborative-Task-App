const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'joshua_admin',
  password: 'password123',
  host: 'db',
  database: 'task_manager_db',
  port: 5432,
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(400).json({ error: 'Username or email already exists' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      'your_secret_key_here',
      { expiresIn: '7d' }
    );
    res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, 'your_secret_key_here');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get current user info (for session restore)
app.get('/api/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (for task assignment dropdown)
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email FROM users ORDER BY username');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tasks assigned to logged-in user
app.get('/api/tasks', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.username as assigned_to_name 
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = $1
      ORDER BY 
        CASE t.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        t.due_date ASC NULLS LAST
    `, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new task
app.post('/api/tasks', verifyToken, async (req, res) => {
  const { title, description, assigned_to, priority, due_date } = req.body;
  try {
    const finalAssignee = assigned_to && assigned_to !== '' ? parseInt(assigned_to) : req.userId;
    
    const result = await pool.query(
      'INSERT INTO tasks (title, description, assigned_to, priority, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, finalAssignee, priority || 'medium', due_date, 'pending']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update task status
app.put('/api/tasks/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get task statistics
app.get('/api/tasks/stats', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 ELSE 0 END) as overdue
      FROM tasks 
      WHERE assigned_to = $1
    `, [req.userId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});