import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuthPage from './AuthPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import EmailVerificationPage from './EmailVerificationPage';
import ProfileSetupPage from './ProfileSetupPage';
import ProfilePage from './ProfilePage';

const SCREEN = {
  AUTH: 'auth',
  FORGOT: 'forgot',
  VERIFY: 'verify',
  PROFILE_SETUP: 'profile_setup',
  PROFILE: 'profile',
  DASHBOARD: 'dashboard',
};

// Inject global styles
const injectStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1c1c26; border-radius: 3px; }
    .task-card { transition: transform 0.2s, box-shadow 0.2s; }
    .task-card:hover { transform: translateY(-3px); }
  `;
  document.head.appendChild(style);
  document.title = 'ProFlow · Task Management';
};
injectStyles();

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [dashboardDark, setDashboardDark] = useState(true);
  const [userAvatar, setUserAvatar] = useState(null);
  
  // Screen routing
  const [screen, setScreen] = useState(SCREEN.AUTH);
  const [pendingEmail, setPendingEmail] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });

  axios.defaults.baseURL = 'http://localhost:5000';

  // Dashboard colors based on dark mode - FIXED for better contrast
  const dashboardColors = dashboardDark ? {
    bg: '#0a0a0f',
    surface: '#13131a',
    surface2: '#1c1c26',
    surface3: '#252533',
    border: 'rgba(255,255,255,0.08)',
    borderLight: 'rgba(255,255,255,0.05)',
    textPrimary: '#f5f5f7',
    textSecondary: '#a1a1b5',
    textTertiary: '#6e6e85',
    textLabel: '#8a8aa0',
    accent: '#7c6af5',
    danger: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    cardShadow: '0 4px 20px rgba(0,0,0,0.2)',
    cardHoverShadow: '0 8px 30px rgba(0,0,0,0.3)',
  } : {
    bg: '#f3f4f6',        // Darker background for depth
    surface: '#ffffff',    // Pure white cards
    surface2: '#f9fafb',   // Slightly off-white for inputs
    surface3: '#f0f1f3',
    border: 'rgba(0,0,0,0.1)',
    borderLight: 'rgba(0,0,0,0.05)',
    textPrimary: '#111827',  // Dark gray, not black
    textSecondary: '#4b5563', // Medium gray
    textTertiary: '#9ca3af',  // Light gray
    textLabel: '#6b7280',     // Label gray
    accent: '#7c6af5',
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    cardShadow: '0 2px 8px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
    cardHoverShadow: '0 8px 24px rgba(0,0,0,0.1)',
  };

  // Restore session on refresh
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setToken(storedToken);
      const fetchCurrentUser = async () => {
        try {
          const res = await axios.get('/api/me');
          setUser(res.data.user);
          // Load saved avatar
          const savedAvatar = localStorage.getItem(`avatar_${res.data.user.id}`);
          if (savedAvatar) setUserAvatar(savedAvatar);
          fetchTasks();
          fetchStats();
          fetchUsers();
          setScreen(SCREEN.DASHBOARD);
        } catch (err) {
          localStorage.removeItem('token');
          setToken(null);
          setScreen(SCREEN.AUTH);
        }
      };
      fetchCurrentUser();
    }
  }, []);

  useEffect(() => {
    if (token && screen === SCREEN.DASHBOARD) {
      fetchTasks();
      fetchStats();
      fetchUsers();
    }
  }, [token]);

  useEffect(() => { filterTasks(); }, [activeFilter, tasks]);
  
  // Deadline alerts
  useEffect(() => {
    if (tasks.length > 0) {
      checkDeadlineAlerts();
    }
  }, [tasks]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const checkDeadlineAlerts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    tasks.forEach(task => {
      if (task.due_date && task.status !== 'completed') {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysLeft === 1) {
          showMessage(`⚠️ Task "${task.title}" is due tomorrow!`, 'warning');
        } else if (daysLeft === 0) {
          showMessage(`🔴 Task "${task.title}" is due TODAY!`, 'warning');
        } else if (daysLeft < 0) {
          showMessage(`❌ Task "${task.title}" is OVERDUE!`, 'error');
        }
      }
    });
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tasks');
      setTasks(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/tasks/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const filterTasks = () => {
    if (activeFilter === 'all') setFilteredTasks(tasks);
    else if (['high', 'medium', 'low'].includes(activeFilter)) setFilteredTasks(tasks.filter(t => t.priority === activeFilter));
    else if (activeFilter === 'overdue') setFilteredTasks(tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'completed'));
    else if (activeFilter === 'completed') setFilteredTasks(tasks.filter(t => t.status === 'completed'));
    else if (activeFilter === 'pending') setFilteredTasks(tasks.filter(t => t.status === 'pending'));
  };

  const handleAuthSuccess = (userData, isNew) => {
    setUser(userData);
    setIsNewUser(isNew);
    setPendingEmail(userData.email || '');
    if (isNew) {
      setScreen(SCREEN.PROFILE_SETUP);
    } else {
      setScreen(SCREEN.DASHBOARD);
    }
  };

  const handleProfileComplete = (profile) => {
    console.log('Profile saved:', profile);
    // Save avatar to localStorage if provided
    if (profile.avatar) {
      setUserAvatar(profile.avatar);
      localStorage.setItem(`avatar_${user?.id}`, profile.avatar);
    }
    setScreen(SCREEN.DASHBOARD);
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    if (updatedUser.avatar) {
      setUserAvatar(updatedUser.avatar);
      localStorage.setItem(`avatar_${updatedUser.id}`, updatedUser.avatar);
    }
  };

  const handleVerified = () => {
    setScreen(SCREEN.PROFILE_SETUP);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    setScreen(SCREEN.AUTH);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) { showMessage('Task title is required', 'error'); return; }
    try {
      const taskData = {
        ...newTask,
        assigned_to: newTask.assigned_to ? parseInt(newTask.assigned_to) : null
      };
      await axios.post('/api/tasks', taskData);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
      fetchTasks();
      fetchStats();
      showMessage('Task created!', 'success');
      setIsModalOpen(false);
    } catch (err) { showMessage('Failed to create task', 'error'); }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
      fetchStats();
      showMessage('Updated!', 'success');
    } catch (err) { showMessage('Failed to update', 'error'); }
  };

  const deleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        fetchTasks();
        fetchStats();
        showMessage('Task deleted', 'success');
      } catch (err) { showMessage('Failed to delete', 'error'); }
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'high': return { color: dashboardColors.danger, bg: `${dashboardColors.danger}20`, label: 'High' };
      case 'medium': return { color: dashboardColors.warning, bg: `${dashboardColors.warning}20`, label: 'Medium' };
      case 'low': return { color: dashboardColors.success, bg: `${dashboardColors.success}20`, label: 'Low' };
      default: return { color: dashboardColors.textSecondary, bg: `${dashboardColors.textSecondary}20`, label: 'Normal' };
    }
  };

  const getProgress = () => {
    if (!stats.total || stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

  const getUserName = (userId) => {
    const u = users.find(u => u.id === userId);
    return u ? u.username : 'Unassigned';
  };

  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  const formatDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  };

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    background: dashboardColors.surface2,
    border: `1px solid ${dashboardColors.border}`,
    borderRadius: '10px',
    color: dashboardColors.textPrimary,
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '12px',
    outline: 'none',
  };

  // SCREEN ROUTING
  if (screen === SCREEN.AUTH) {
    return <AuthPage onSuccess={handleAuthSuccess} onForgotPassword={() => setScreen(SCREEN.FORGOT)} />;
  }

  if (screen === SCREEN.FORGOT) {
    return <ForgotPasswordPage onBack={() => setScreen(SCREEN.AUTH)} dark={true} />;
  }

  if (screen === SCREEN.VERIFY) {
    return <EmailVerificationPage email={pendingEmail} onVerified={handleVerified} onResend={() => console.log('Resend')} dark={true} />;
  }

  if (screen === SCREEN.PROFILE_SETUP) {
    return <ProfileSetupPage user={user} onComplete={handleProfileComplete} dark={true} />;
  }

  if (screen === SCREEN.PROFILE) {
    return <ProfilePage user={user} onBack={() => setScreen(SCREEN.DASHBOARD)} onUpdate={handleProfileUpdate} />;
  }

  // DASHBOARD
  const progress = getProgress();
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'high', label: '🔴 High' },
    { id: 'medium', label: '🟡 Medium' },
    { id: 'low', label: '🟢 Low' },
    { id: 'overdue', label: '⚠️ Overdue' },
    { id: 'completed', label: '✅ Done' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: dashboardColors.bg, display: 'flex' }}>
      {/* SIDEBAR */}
      <aside style={{
        width: '260px',
        minHeight: '100vh',
        background: dashboardColors.surface,
        borderRight: `1px solid ${dashboardColors.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        boxShadow: dashboardDark ? 'none' : '1px 0 0 rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: '32px', height: '32px', background: `linear-gradient(135deg, ${dashboardColors.accent}, #a89ef8)`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: '800' }}>P</span>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: dashboardColors.textPrimary }}>ProFlow</div>
            <div style={{ fontSize: '11px', color: dashboardColors.textTertiary }}>Task Management</div>
          </div>
        </div>

        <button onClick={() => setIsModalOpen(true)} style={{
          width: '100%', padding: '12px', background: `linear-gradient(135deg, ${dashboardColors.accent}, #a89ef8)`, border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '24px'
        }}>
          + New Task
        </button>

        {/* Dark Mode Toggle inside Dashboard */}
        <button onClick={() => setDashboardDark(!dashboardDark)} style={{
          width: '100%', padding: '10px', background: dashboardColors.surface2, border: `1px solid ${dashboardColors.border}`, borderRadius: '10px', color: dashboardColors.textSecondary, fontSize: '13px', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}>
          {dashboardDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>

        <div style={{ fontSize: '11px', fontWeight: '600', color: dashboardColors.textLabel, marginBottom: '12px', letterSpacing: '0.5px' }}>FILTERS</div>
        
        {filters.map(f => (
          <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{
            width: '100%', padding: '10px', background: activeFilter === f.id ? `${dashboardColors.accent}20` : 'transparent', border: 'none', borderRadius: '8px', color: activeFilter === f.id ? dashboardColors.accent : dashboardColors.textSecondary, fontSize: '13px', cursor: 'pointer', textAlign: 'left', marginBottom: '4px'
          }}>
            {f.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* User Profile - Clickable */}
        <div style={{ borderTop: `1px solid ${dashboardColors.border}`, paddingTop: '16px', marginTop: '16px' }}>
          <div 
            onClick={() => setScreen(SCREEN.PROFILE)} 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer' }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: userAvatar ? 'transparent' : `linear-gradient(135deg, ${dashboardColors.accent}, #a89ef8)`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700' }}>
              {userAvatar ? (
                <img src={userAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.username?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: dashboardColors.textPrimary }}>{user?.username}</div>
              <div style={{ fontSize: '11px', color: dashboardColors.textTertiary }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: `${dashboardColors.danger}20`, border: `1px solid ${dashboardColors.danger}40`, borderRadius: '8px', color: dashboardColors.danger, fontSize: '12px', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, marginLeft: '260px', padding: '32px 40px' }}>
        {/* Toast Message with Warning Support */}
        {message.text && (
          <div style={{ 
            position: 'fixed', top: '20px', right: '20px', padding: '12px 20px', 
            borderRadius: '10px', fontSize: '13px', zIndex: 1000,
            backdropFilter: 'blur(10px)', boxShadow: dashboardColors.cardShadow,
            backgroundColor: message.type === 'success' ? `${dashboardColors.success}20` : 
                            message.type === 'warning' ? `${dashboardColors.warning}20` : 
                            `${dashboardColors.danger}20`,
            border: `1px solid ${message.type === 'success' ? `${dashboardColors.success}50` : 
                                  message.type === 'warning' ? `${dashboardColors.warning}50` : 
                                  `${dashboardColors.danger}50`}`,
            color: message.type === 'success' ? dashboardColors.success : 
                   message.type === 'warning' ? dashboardColors.warning : 
                   dashboardColors.danger
          }}>
            {message.text}
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '13px', color: dashboardColors.textLabel }}>{getGreeting()}, {user?.username} 👋</p>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: dashboardColors.textPrimary }}>Dashboard</h1>
        </div>

        {/* Stats - Fixed contrast */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Tasks', value: stats.total, color: dashboardColors.accent },
            { label: 'Completed', value: stats.completed, color: dashboardColors.success },
            { label: 'Pending', value: stats.pending, color: dashboardColors.warning },
            { label: 'Overdue', value: stats.overdue, color: dashboardColors.danger },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: dashboardColors.surface, border: `1px solid ${dashboardColors.border}`, borderRadius: '16px', padding: '20px', boxShadow: dashboardColors.cardShadow }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: dashboardColors.textLabel, marginBottom: '8px', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color }}>{value ?? 0}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ background: dashboardColors.surface, border: `1px solid ${dashboardColors.border}`, borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: dashboardColors.cardShadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: dashboardColors.textPrimary }}>Overall Progress</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: dashboardColors.accent }}>{progress}%</span>
          </div>
          <div style={{ height: '6px', background: dashboardColors.surface2, borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${dashboardColors.accent}, #a89ef8)`, borderRadius: '3px' }} />
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: dashboardColors.textLabel }}>
            {stats.completed ?? 0} of {stats.total ?? 0} tasks completed
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: dashboardColors.textLabel }}>Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: dashboardColors.surface, borderRadius: '16px', boxShadow: dashboardColors.cardShadow }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: dashboardColors.textPrimary, marginBottom: '6px' }}>No tasks here</div>
            <div style={{ fontSize: '14px', color: dashboardColors.textLabel }}>Click "+ New Task" to get started</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {filteredTasks.map(task => {
              const pc = getPriorityConfig(task.priority);
              const overdue = isOverdue(task);
              return (
                <div key={task.id} className="task-card" style={{ background: dashboardColors.surface, border: `1px solid ${overdue ? `${dashboardColors.danger}30` : dashboardColors.borderLight}`, borderRadius: '16px', padding: '20px', boxShadow: dashboardColors.cardShadow, transition: 'all 0.2s' }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: dashboardColors.textPrimary }}>{task.title}</h3>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: pc.bg, color: pc.color, fontWeight: '600' }}>{pc.label}</span>
                  </div>
                  
                  {task.description && (
                    <p style={{ fontSize: '13px', color: dashboardColors.textSecondary, marginBottom: '16px', lineHeight: '1.5' }}>{task.description}</p>
                  )}
                  
                  <div style={{ height: '1px', background: dashboardColors.borderLight, margin: '8px 0 14px' }} />
                  
                  {/* Meta rows - Visual Hierarchy Fix */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '500', color: dashboardColors.textLabel, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Status</span>
                      <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)} style={{ background: dashboardColors.surface2, border: `1px solid ${dashboardColors.border}`, borderRadius: '6px', padding: '4px 8px', color: dashboardColors.textPrimary, fontSize: '12px', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '500', color: dashboardColors.textLabel, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Assigned to</span>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: dashboardColors.textSecondary }}>{getUserName(task.assigned_to)}</span>
                    </div>

                    {task.due_date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '500', color: dashboardColors.textLabel, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Due date</span>
                        <span style={{ fontSize: '13px', fontWeight: overdue ? '600' : '500', color: overdue ? dashboardColors.danger : dashboardColors.textSecondary }}>
                          📅 {formatDate(task.due_date)}{overdue && ' · Overdue'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <button onClick={() => deleteTask(task.id)} style={{ width: '100%', padding: '9px', background: 'transparent', border: `1px solid ${dashboardColors.border}`, borderRadius: '8px', color: dashboardColors.textTertiary, fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Delete Task
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CREATE TASK MODAL */}
      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: dashboardColors.surface, border: `1px solid ${dashboardColors.border}`, borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '450px', boxShadow: dashboardColors.cardShadow }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: dashboardColors.textPrimary, marginBottom: '8px' }}>New Task</h2>
            <p style={{ fontSize: '13px', color: dashboardColors.textLabel, marginBottom: '24px' }}>Fill in the details below</p>
            <form onSubmit={handleCreateTask}>
              <input type="text" placeholder="Task title" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} style={inputStyle} required />
              <textarea placeholder="Description (optional)" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} rows="3" style={{ ...inputStyle, resize: 'vertical' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} style={inputStyle}>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
                <input type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} style={{ ...inputStyle }} />
              </div>
              <select value={newTask.assigned_to} onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })} style={inputStyle}>
                <option value="">Assign to...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${dashboardColors.border}`, borderRadius: '10px', color: dashboardColors.textSecondary, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: dashboardColors.accent, border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;