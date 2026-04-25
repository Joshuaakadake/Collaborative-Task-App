import React, { useState } from 'react';
import axios from 'axios';

export default function AuthPage({ onSuccess, onForgotPassword }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPw, setRegConfirmPw] = useState('');

  const colors = darkMode ? {
    bg: '#0a0a0f',
    surface: '#13131a',
    surface2: '#1c1c26',
    border: 'rgba(255,255,255,0.08)',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1b5',
    accent: '#7c6af5',
    accentHover: '#5a4ad1',
  } : {
    bg: '#f5f5f7',
    surface: '#ffffff',
    surface2: '#e8e8ec',
    border: 'rgba(0,0,0,0.08)',
    textPrimary: '#12121e',
    textSecondary: '#5f5f7a',
    accent: '#7c6af5',
    accentHover: '#5a4ad1',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/login', { email: loginEmail, password: loginPassword });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      onSuccess?.(res.data.user, false);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (regPassword !== regConfirmPw) { setError('Passwords do not match.'); return; }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await axios.post('/api/register', { username: regUsername, email: regEmail, password: regPassword });
      const res = await axios.post('/api/login', { email: regEmail, password: regPassword });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      onSuccess?.(res.data.user, true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  const handleSocialClick = (provider) => {
    const mockUser = {
      username: `${provider}_user`,
      email: `user@${provider}.com`,
      id: null,
      fromSocial: provider,
    };
    onSuccess?.(mockUser, true);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: colors.surface2,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    color: colors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, padding: '20px' }}>
      {/* Dark Mode Toggle */}
      <button onClick={() => setDarkMode(!darkMode)} style={{ position: 'absolute', top: '20px', right: '20px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '8px 12px', color: colors.textPrimary, cursor: 'pointer', fontSize: '14px', zIndex: 10 }}>
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      <div style={{ width: '100%', maxWidth: '1000px', minHeight: '550px', display: 'flex', flexWrap: 'wrap', background: `linear-gradient(135deg, ${colors.accent}08, ${colors.bg})`, borderRadius: '32px', border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Left Side: Form */}
        <div style={{ flex: 1, minWidth: '280px', padding: '40px', display: 'flex', flexDirection: 'column', background: `rgba(10, 10, 15, 0.3)`, backdropFilter: 'blur(10px)' }}>
          
          {/* Welcome Text - Top */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '12px', color: colors.accent, letterSpacing: '2px', marginBottom: '8px' }}>✨ WELCOME TO PROFLOW</div>
          </div>

          <div style={{ color: colors.accent, fontWeight: '700', marginBottom: '8px', fontSize: '14px' }}>PROFLOW</div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, margin: '0 0 24px 0' }}>
            {isLogin ? 'Login' : 'Register'}
          </h1>

          {error && (
            <div style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid #ff4d4d40', borderRadius: '10px', padding: '10px', marginBottom: '16px', color: '#ff4d4d', fontSize: '13px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleRegister} style={{ width: '100%' }}>
            {!isLogin && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '6px', display: 'block' }}>Username</label>
                <input type="text" placeholder="username" style={inputStyle} value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '6px', display: 'block' }}>Email</label>
              <input type="email" placeholder="username@gmail.com" style={inputStyle} value={isLogin ? loginEmail : regEmail} onChange={(e) => isLogin ? setLoginEmail(e.target.value) : setRegEmail(e.target.value)} required />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '6px', display: 'block' }}>Password</label>
              <input type="password" placeholder="••••••••" style={inputStyle} value={isLogin ? loginPassword : regPassword} onChange={(e) => isLogin ? setLoginPassword(e.target.value) : setRegPassword(e.target.value)} required />
            </div>

            {!isLogin && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '6px', display: 'block' }}>Confirm Password</label>
                <input type="password" placeholder="••••••••" style={inputStyle} value={regConfirmPw} onChange={(e) => setRegConfirmPw(e.target.value)} required />
              </div>
            )}

            {isLogin && (
              <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                <span onClick={onForgotPassword} style={{ color: colors.accent, fontSize: '13px', cursor: 'pointer' }}>Forgot Password?</span>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? colors.accentHover : colors.accent, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px' }}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '13px', color: colors.textSecondary }}>
            Or Continue With
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button onClick={() => handleSocialClick('google')} style={{ flex: 1, padding: '10px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '10px', color: colors.textPrimary, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button onClick={() => handleSocialClick('github')} style={{ flex: 1, padding: '10px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '10px', color: colors.textPrimary, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={colors.textPrimary}><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                GitHub
              </button>
            </div>
          </div>

          <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '13px', color: colors.textSecondary, paddingTop: '24px' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <span onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ color: colors.accent, cursor: 'pointer', fontWeight: '600' }}>
              {isLogin ? 'Register for free' : 'Login here'}
            </span>
          </div>

          {/* Bottom Text */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: colors.textSecondary, letterSpacing: '1px' }}>YOUR ULTIMATE TASK MANAGEMENT APP</div>
          </div>
        </div>

        {/* Right Side: Visual Area */}
        <div style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: `linear-gradient(135deg, ${colors.accent}15, transparent)` }}>
          <div style={{ width: '200px', height: '200px', background: `linear-gradient(135deg, ${colors.accent}30, #a89ef830)`, borderRadius: '40% 60% 70% 30% / 40% 50% 60% 70%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float 6s ease-in-out infinite' }}>
            <div style={{ fontSize: '60px' }}>🚀</div>
          </div>
          <div style={{ position: 'absolute', top: '20%', right: '20%', fontSize: '24px', opacity: 0.4 }}>✨</div>
          <div style={{ position: 'absolute', bottom: '25%', left: '15%', fontSize: '24px', opacity: 0.4 }}>⚡</div>
        </div>
      </div>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}