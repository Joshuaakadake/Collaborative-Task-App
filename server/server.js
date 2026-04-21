const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const pool = new Pool({
    user: 'joshua_admin',
    password: 'password123',
    host: 'db',
    database: 'task_manager_db',
    port: 5432,
});

// ============ AUTHENTICATION ============

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
            { expiresIn: '24h' }
        );
        res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Middleware to verify token
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

// ============ TASKS CRUD ============

app.get('/api/tasks', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT tasks.*, users.username as assigned_to_name 
            FROM tasks 
            LEFT JOIN users ON tasks.assigned_to = users.id
            WHERE tasks.assigned_to = $1
            ORDER BY 
                CASE priority 
                    WHEN 'high' THEN 1 
                    WHEN 'medium' THEN 2 
                    WHEN 'low' THEN 3 
                END,
                due_date ASC NULLS LAST
        `, [req.userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tasks', verifyToken, async (req, res) => {
    const { title, description, assigned_to, priority, due_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, description, assigned_to, priority, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, assigned_to || req.userId, priority || 'medium', due_date]
        );
        
        // Create notification for assigned user
        if (assigned_to && assigned_to !== req.userId) {
            await pool.query(
                'INSERT INTO notifications (user_id, task_id, message) VALUES ($1, $2, $3)',
                [assigned_to, result.rows[0].id, `You have been assigned a new task: ${title}`]
            );
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/tasks/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', [status, id]);
        
        // Create notification for status change
        const task = await pool.query('SELECT title, assigned_to FROM tasks WHERE id = $1', [id]);
        if (task.rows[0] && task.rows[0].assigned_to !== req.userId) {
            await pool.query(
                'INSERT INTO notifications (user_id, task_id, message) VALUES ($1, $2, $3)',
                [task.rows[0].assigned_to, id, `Task "${task.rows[0].title}" status changed to ${status}`]
            );
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/tasks/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ PRIORITY & FILTERS ============

app.get('/api/tasks/priority/:level', verifyToken, async (req, res) => {
    const { level } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM tasks WHERE assigned_to = $1 AND priority = $2 ORDER BY due_date ASC',
            [req.userId, level]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tasks/overdue', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM tasks WHERE assigned_to = $1 AND due_date < CURRENT_DATE AND status != $2 ORDER BY due_date ASC",
            [req.userId, 'completed']
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tasks/stats', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 ELSE 0 END) as overdue
            FROM tasks 
            WHERE assigned_to = $1
        `, [req.userId]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ COMMENTS ============

app.get('/api/tasks/:taskId/comments', verifyToken, async (req, res) => {
    const { taskId } = req.params;
    try {
        const result = await pool.query(
            `SELECT comments.*, users.username 
             FROM comments 
             JOIN users ON comments.user_id = users.id 
             WHERE task_id = $1 
             ORDER BY created_at DESC`,
            [taskId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tasks/:taskId/comments', verifyToken, async (req, res) => {
    const { taskId } = req.params;
    const { comment } = req.body;
    if (!comment || comment.trim() === '') {
        return res.status(400).json({ error: 'Comment cannot be empty' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO comments (task_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *',
            [taskId, req.userId, comment]
        );
        
        // Get task owner for notification
        const task = await pool.query('SELECT title, assigned_to FROM tasks WHERE id = $1', [taskId]);
        if (task.rows[0] && task.rows[0].assigned_to !== req.userId) {
            await pool.query(
                'INSERT INTO notifications (user_id, task_id, message) VALUES ($1, $2, $3)',
                [task.rows[0].assigned_to, taskId, `${req.userId} commented on task "${task.rows[0].title}"`]
            );
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/comments/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const commentCheck = await pool.query('SELECT user_id FROM comments WHERE id = $1', [id]);
        if (commentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        if (commentCheck.rows[0].user_id !== req.userId) {
            return res.status(403).json({ error: 'You can only delete your own comments' });
        }
        await pool.query('DELETE FROM comments WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ TEAMS ============

app.post('/api/teams', verifyToken, async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO teams (name, created_by) VALUES ($1, $2) RETURNING *',
            [name, req.userId]
        );
        await pool.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
            [result.rows[0].id, req.userId, 'admin']
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/teams', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT teams.*, 
                   (SELECT COUNT(*) FROM team_members WHERE team_id = teams.id) as member_count
            FROM teams 
            JOIN team_members ON teams.id = team_members.team_id 
            WHERE team_members.user_id = $1
        `, [req.userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/teams/:teamId/members', verifyToken, async (req, res) => {
    const { teamId } = req.params;
    const { email, role } = req.body;
    try {
        const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        await pool.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [teamId, user.rows[0].id, role || 'member']
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/teams/:teamId/members', verifyToken, async (req, res) => {
    const { teamId } = req.params;
    try {
        const result = await pool.query(`
            SELECT users.id, users.username, users.email, team_members.role, team_members.joined_at
            FROM team_members 
            JOIN users ON team_members.user_id = users.id 
            WHERE team_members.team_id = $1
        `, [teamId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ NOTIFICATIONS ============

app.get('/api/notifications', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/notifications/:id/read', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [id, req.userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/notifications/read-all', verifyToken, async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ TEAM TASKS (Collaboration) ============

app.get('/api/team-tasks', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT tasks.*, users.username as assigned_to_name, teams.name as team_name
            FROM tasks 
            JOIN users ON tasks.assigned_to = users.id
            JOIN team_members ON team_members.user_id = users.id
            JOIN teams ON team_members.team_id = teams.id
            WHERE team_members.user_id = $1
            ORDER BY tasks.created_at DESC
        `, [req.userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});