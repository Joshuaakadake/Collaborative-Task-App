const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. DATABASE CONNECTION ---
const pool = new Pool({
user: 'postgres',
host: 'localhost',
database: 'postgres',
password: 'yourpassword', // Replace with your pgAdmin password
port: 5432,
});

const JWT_SECRET = "lynesophy_secret_key_2024";

// --- 2. AUTHENTICATION ROUTES ---

// Register
app.post('/register', async (req, res) => {
const { username, email, password } = req.body;
try {
const hashedPassword = await bcrypt.hash(password, 10);
const newUser = await pool.query(
'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username',
[username, email, hashedPassword]
);
res.json(newUser.rows[0]);
} catch (err) {
res.status(500).json({ message: "Registration failed. Email might exist." });
}
});

// Login (Issues JWT)
app.post('/login', async (req, res) => {
const { email, password } = req.body;
try {
const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
if (user.rows.length > 0 && await bcrypt.compare(password, user.rows[0].password_hash)) {
const token = jwt.sign(
{ userId: user.rows[0].id, username: user.rows[0].username },
JWT_SECRET, { expiresIn: '2h' }
);
res.json({
token,
userId: user.rows[0].id,
username: user.rows[0].username
});
} else {
res.status(400).json({ message: "Invalid email or password" });
}
} catch (err) {
res.status(500).json({ message: "Server error" });
}
});

// --- 3. TASK ROUTES ---

app.get('/tasks/:userId', async (req, res) => {
try {
const { userId } = req.params;
const tasks = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY id ASC', [userId]);
res.json(tasks.rows);
} catch (err) {
res.status(500).send("Error fetching tasks");
}
});

app.post('/tasks', async (req, res) => {
const { user_id, title, description, category, due_date } = req.body;
const finalDate = due_date === "" ? null : due_date;
try {
const newTask = await pool.query(
'INSERT INTO tasks (user_id, title, description, category, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
[user_id, title, description, category, finalDate]
);
res.json(newTask.rows[0]);
} catch (err) {
res.status(500).send("Database Error");
}
});

app.delete('/tasks/:id', async (req, res) => {
try {
await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
res.send("Deleted");
} catch (err) {
res.status(500).send("Delete failed");
}
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

