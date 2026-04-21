const express = require('express');
<<<<<<< HEAD
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

// Database Connection - Optimized for your 4GB RAM Laptop
const pool = new Pool({
user: 'postgres',
host: 'localhost',
database: 'collaborative_task_app',
password: 'lyne1707', // Your specific password
port: 5432,
});

const SECRET_KEY = 'your_secret_key_here';

// --- AUTHENTICATION ---

app.post('/api/register', async (req, res) => {
const { username, password } = req.body;
try {
const hashedPassword = await bcrypt.hash(password, 10);
const result = await pool.query(
'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
[username, hashedPassword]
);
res.status(201).json(result.rows[0]);
} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.post('/api/login', async (req, res) => {
const { username, password } = req.body;
try {
const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
const user = result.rows[0];
if (user && await bcrypt.compare(password, user.password)) {
const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
res.json({ token });
} else {
res.status(401).json({ error: 'Invalid credentials' });
}
} catch (err) {
res.status(500).json({ error: err.message });
}
});

// --- TASK ENDPOINTS (Steps 8 - 12) ---

// Create Task with Priority and Due Date
app.post('/api/tasks', async (req, res) => {
const { title, description, assigned_to, priority, due_date } = req.body;
const token = req.headers.authorization?.split(' ')[1];

if (!token) return res.status(401).json({ error: 'Unauthorized' });

// Step 10: Validation for priority
const validPriorities = ['high', 'medium', 'low'];
if (priority && !validPriorities.includes(priority)) {
return res.status(400).json({ error: 'Priority must be high, medium, or low' });
}

try {
const decoded = jwt.verify(token, SECRET_KEY);
const result = await pool.query(
'INSERT INTO tasks (title, description, assigned_to, priority, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
[title, description, assigned_to || decoded.userId, priority || 'medium', due_date]
);
res.status(201).json(result.rows[0]);
} catch (err) {
res.status(500).json({ error: err.message });
}
});

// Get All Tasks (Step 9)
app.get('/api/tasks', async (req, res) => {
const token = req.headers.authorization?.split(' ')[1];
if (!token) return res.status(401).json({ error: 'Unauthorized' });

try {
const decoded = jwt.verify(token, SECRET_KEY);
const result = await pool.query(
'SELECT id, title, description, status, priority, due_date, assigned_to FROM tasks WHERE assigned_to = $1',
[decoded.userId]
);
res.json(result.rows);
} catch (err) {
res.status(500).json({ error: err.message });
}
});

// Get Tasks by Priority (Step 11)
app.get('/api/tasks/priority/:level', async (req, res) => {
const { level } = req.params;
const token = req.headers.authorization?.split(' ')[1];
if (!token) return res.status(401).json({ error: 'Unauthorized' });

try {
const decoded = jwt.verify(token, SECRET_KEY);
const result = await pool.query(
'SELECT * FROM tasks WHERE assigned_to = $1 AND priority = $2 ORDER BY created_at DESC',
[decoded.userId, level]
);
res.json(result.rows);
} catch (err) {
res.status(500).json({ error: err.message });
}
});

// Get Overdue Tasks (Step 12)
app.get('/api/tasks/overdue', async (req, res) => {
const token = req.headers.authorization?.split(' ')[1];
if (!token) return res.status(401).json({ error: 'Unauthorized' });

try {
const decoded = jwt.verify(token, SECRET_KEY);
const result = await pool.query(
'SELECT * FROM tasks WHERE assigned_to = $1 AND due_date < CURRENT_DATE AND status != $2 ORDER BY due_date ASC',
[decoded.userId, 'completed']
);
res.json(result.rows);
} catch (err) {
res.status(500).json({ error: err.message });
}
});

const PORT = 5000;
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});

=======
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://joshua_admin:password123@db:5432/task_manager_db',
});

// Test DB connection
pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to database!');
  }
});

// Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a task
app.post('/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    const newTask = await pool.query(
      'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *',
      [title, description]
    );
    res.json(newTask.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));
>>>>>>> main
