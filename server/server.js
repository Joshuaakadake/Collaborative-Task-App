const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to PostgreSQL (using credentials from docker-compose.yml)
const pool = new Pool({
  user: 'joshua_admin',
  password: 'password123',
  host: 'db',  // 'db' is the service name in docker-compose
  database: 'task_manager_db',
  port: 5432,
});

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register a new user
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Hash the password (like putting it in a locked box)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save user to database
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
    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create a token (like a wristband that proves you're logged in)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      'your_secret_key_here',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true, 
      token: token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tasks.*, users.username as assigned_to_name 
      FROM tasks 
      LEFT JOIN users ON tasks.assigned_to = users.id
      ORDER BY tasks.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  const { title, description, assigned_to, due_date } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, assigned_to, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, assigned_to, due_date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});