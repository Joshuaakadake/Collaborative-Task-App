import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Connects to your backend

function App() {const [comments, setComments] = useState([]); // Stores comments for each task
  const [newComment, setNewComment] = useState(""); // Stores what you are typing

  const [tasks, setTasks] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: '' });
  const [loading, setLoading] = useState(true);

  // Configure axios to always send the token
  axios.defaults.baseURL = 'http://localhost:5000';
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
   const fetchTasks = async () => {
  setLoading(true);
  try {
    const res = await axios.get('http://localhost:5000/api/tasks');
    setTasks(res.data); 
  } catch (err) {
    console.error("Failed to fetch tasks:", err);
  } 
  setLoading(false);
};

  // Load tasks when component starts or token changes
  useEffect(() => {
  fetchTasks();
}, [token]); 

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/register', registerForm);
      alert('Registration successful! Please login.');
      setRegisterForm({ username: '', email: '', password: '' });
    } catch (err) {
      alert('Registration failed: ' + err.response?.data?.error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { email: loginEmail, password: loginPassword });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      alert('Login successful!');
    } catch (err) {
      alert('Login failed: ' + err.response?.data?.error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await axios.post('http://localhost:5000/api/tasks', newTask);
      setNewTask({ title: '', description: '', assigned_to: '' });
      fetchTasks();
      fetchStats();

      showMessage('Task created successfully!', 'success');
      setIsModalOpen(false);
    } catch (err) {
      showMessage('Failed to create task', 'error');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        fetchTasks();
      } catch (err) {
        alert('Failed to delete task');
      }
    }
  };
 
  // If not logged in, show login/register screen
  if (!token) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
        <h1>Testing Refresh</h1>
        
        <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
          {/* Login Form */}
          <div style={{ flex: 1, border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
                required
              />
              <button type="submit" style={{ padding: '8px 16px', background: 'blue', color: 'white', border: 'none', borderRadius: '4px' }}>
                Login
              </button>
            </form>
          </div>

          {/* Register Form */}
          <div style={{ flex: 1, border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Username"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
                required
              />
              <button type="submit" style={{ padding: '8px 16px', background: 'green', color: 'white', border: 'none', borderRadius: '4px' }}>
                Register
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

   const handleAddComment = async (taskId) => {
    if (!newComment.trim()) return;
    try {
      await axios.post(`http://localhost:5000/api/tasks/${taskId}/comments`, { 
        user_id: user?.id || 1, 
        comment: newComment 
      });
      setNewComment(""); 
      fetchTasks();
      // Refresh logic would go here
    } catch (err) {
      console.error("FULL ERROR DETAILS:", err.response?.data || err.message);
    }
  };


  // Logged in view - show tasks
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Task Manager</h1>
        <div>
          <span>Welcome, {user?.username}! </span>
          <button onClick={handleLogout} style={{ marginLeft: '10px', padding: '5px 10px' }}>Logout</button>
        </div>
      </div>

      {/* Create Task Form */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h3>Create New Task</h3>
        <form onSubmit={handleCreateTask}>
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
            required
          />
          <textarea
            placeholder="Description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
          />
          <input
            type="number"
            placeholder="Assign to user ID (1,2,3...)"
            value={newTask.assigned_to}
            onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
          />
          <button type="submit" style={{ padding: '8px 16px', background: 'blue', color: 'white', border: 'none', borderRadius: '4px' }}>
            Create Task
          </button>
        </form>
      </div>

      {/* Task List */}
      <div style={{ marginTop: '30px' }}>
        <h3>All Tasks</h3>
        {tasks.length === 0 && <p>No tasks yet. Create one above!</p>}
        {tasks.map(task => (
          <div key={task.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
            <p style={{ margin: '5px 0' }}>{task.description || 'No description'}</p>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Status: <strong>{task.status}</strong> | 
              Assigned to: {task.assigned_to_name || 'Unassigned'} |
              Due: {task.due_date || 'No due date'}
              </p>
            {/* --- START OF TEST BLOCK --- */}
<div style={{ backgroundColor: '#fff9c4', padding: '10px', marginTop: '10px', borderRadius: '5px', border: '1px solid #fbc02d' }}>
    <h5 style={{ margin: '0 0 5px 0' }}>Comments Section</h5>
    {task.comments && task.comments.length > 0 ? (
        task.comments || [].map((c, i) => (
            <div key={i} style={{ borderBottom: '1px solid #ddd', padding: '5px 0' }}>
                <strong>{c.username || 'User'}:</strong> 
                <span>{c.comment || ''}</span>
            </div>
        ))
    ) : (
        <p style={{ fontSize: '12px', color: '#666' }}>No comments recorded in database.</p>
    )}
</div>
{/* --- END OF TEST BLOCK --- */}
            <div>
            {/* Visual Comment Box */}
<div style={{ marginTop: '10px', padding: '10px', background: '#f4f4f4' }}>
  <h6>Comments</h6>
  <input 
    type="text" 
    placeholder="Write a comment..." 
    value={newComment}
    onChange={(e) => setNewComment(e.target.value)}
    style={{ width: '70%', marginRight: '5px' }} 
  />
  {/* The Send Button (The postman) */}
  <button onClick={() => handleAddComment(task.id)}>Send</button>
</div>
              <select 
                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                value={task.status}
                style={{ marginRight: '10px', padding: '5px' }}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button onClick={() => deleteTask(task.id)} style={{ padding: '5px 10px', background: 'red', color: 'white', border: 'none', borderRadius: '4px' }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;