import React, { useState } from 'react';
import axios from 'axios';

/* ─────────────────────────────────────────────
   ForgotPasswordPage
   Props:
     onBack()      — return to login
     dark (bool)   — theme
───────────────────────────────────────────── */
export default function ForgotPasswordPage({ onBack, dark = true }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const c = dark ? {
    bg: '#0c0c14', card: 'rgba(20,20,31,0.95)', cardBorder: 'rgba(255,255,255,0.08)',
    inputBg: 'rgba(255,255,255,0.05)', inputBorder: 'rgba(255,255,255,0.1)',
    textPrimary: '#f0f0f7', textSecondary: '#9191a8', textTertiary: '#5c5c74',
  } : {
    bg: '#f6f6fb', card: 'rgba(255,255,255,0.95)', cardBorder: 'rgba(0,0,0,0.07)',
    inputBg: '#f9f9fc', inputBorder: 'rgba(0,0,0,0.12)',
    textPrimary: '#12121e', textSecondary: '#5f5f7a', textTertiary: '#9494ae',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Hook up your reset endpoint here — for now we simulate
    try {
      // await axios.post('/api/forgot-password', { email });
      await new Promise(r => setTimeout(r, 1000)); // simulate
      setSent(true);
    } catch (err) { setSent(true); } // show success regardless (security best practice)
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 420, background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: 24, padding: '40px 36px', boxShadow: dark ? '0 24px 80px rgba(0,0,0,0.45)' : '0 24px 80px rgba(0,0,0,0.1)', backdropFilter: 'blur(20px)', animation: 'pfFadeUp 0.35s ease both' }}>

        {!sent ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🔑</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.6px', marginBottom: 8 }}>Reset your password</h2>
            <p style={{ fontSize: 14, color: c.textSecondary, lineHeight: 1.6, marginBottom: 28 }}>
              Enter your account email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: focused ? '#6366f1' : c.textTertiary, pointerEvents: 'none' }}>✉</span>
                <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                  style={{ width: '100%', padding: '12px 14px 12px 40px', background: c.inputBg, border: `1.5px solid ${focused ? '#6366f1' : c.inputBorder}`, borderRadius: 12, color: c.textPrimary, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none', transition: 'all 0.2s', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" disabled={loading} style={{ padding: '13px', background: loading ? 'rgba(99,102,241,0.6)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.6px', marginBottom: 10 }}>Check your inbox</h2>
            <p style={{ fontSize: 14, color: c.textSecondary, lineHeight: 1.7, marginBottom: 28 }}>
              If <strong style={{ color: c.textPrimary }}>{email}</strong> is in our system, you'll receive a reset link shortly.
            </p>
            <div style={{ padding: '14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, fontSize: 13, color: '#8b8ff8', marginBottom: 28 }}>
              Didn't get it? Check your spam folder or try again.
            </div>
          </div>
        )}

        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: c.textSecondary, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginTop: sent ? 0 : 16, padding: 0 }}>
          ← Back to sign in
        </button>
      </div>
    </div>
  );
}