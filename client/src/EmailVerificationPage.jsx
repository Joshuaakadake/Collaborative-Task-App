import React, { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────
   EmailVerificationPage — 6-digit OTP entry
   Props:
     email (string)     — email address shown
     onVerified()       — proceed after verification
     onResend()         — resend code
     dark (bool)
───────────────────────────────────────────── */
export default function EmailVerificationPage({ email, onVerified, onResend, dark = true }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const refs = useRef([]);

  const c = dark ? {
    bg: '#0c0c14', card: 'rgba(20,20,31,0.95)', cardBorder: 'rgba(255,255,255,0.08)',
    inputBg: 'rgba(255,255,255,0.05)', inputBorder: 'rgba(255,255,255,0.1)',
    textPrimary: '#f0f0f7', textSecondary: '#9191a8', textTertiary: '#5c5c74',
  } : {
    bg: '#f6f6fb', card: 'rgba(255,255,255,0.95)', cardBorder: 'rgba(0,0,0,0.07)',
    inputBg: '#f9f9fc', inputBorder: 'rgba(0,0,0,0.12)',
    textPrimary: '#12121e', textSecondary: '#5f5f7a', textTertiary: '#9494ae',
  };

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...code];
    updated[i] = val.slice(-1);
    setCode(updated);
    setError('');
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (updated.every(d => d !== '')) handleVerify(updated.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const arr = pasted.split('');
      setCode(arr);
      refs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (fullCode) => {
    setLoading(true);
    setError('');
    try {
      // await axios.post('/api/verify-email', { code: fullCode });
      await new Promise(r => setTimeout(r, 800));
      onVerified?.();
    } catch (err) {
      setError('Invalid or expired code. Please try again.');
      setCode(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    }
    setLoading(false);
  };

  const handleResend = async () => {
    onResend?.();
    setResent(true);
    setCountdown(30);
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 420, background: c.card, border: `1px solid ${c.cardBorder}`, borderRadius: 24, padding: '40px 36px', boxShadow: dark ? '0 24px 80px rgba(0,0,0,0.45)' : '0 24px 80px rgba(0,0,0,0.1)', backdropFilter: 'blur(20px)', textAlign: 'center', animation: 'pfFadeUp 0.35s ease both' }}>

        <div style={{ fontSize: 44, marginBottom: 16 }}>📧</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.6px', marginBottom: 10 }}>Verify your email</h2>
        <p style={{ fontSize: 14, color: c.textSecondary, lineHeight: 1.7, marginBottom: 32 }}>
          We sent a 6-digit code to<br />
          <strong style={{ color: c.textPrimary }}>{email || 'your email'}</strong>
        </p>

        {/* OTP Inputs */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input key={i} ref={el => refs.current[i] = el}
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                width: 48, height: 56, textAlign: 'center',
                fontSize: 22, fontWeight: 700, color: c.textPrimary,
                background: c.inputBg, border: `1.5px solid ${digit ? '#6366f1' : c.inputBorder}`,
                borderRadius: 12, outline: 'none', fontFamily: 'inherit',
                boxShadow: digit ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}
        {loading && <p style={{ color: '#6366f1', fontSize: 13, marginBottom: 16 }}>Verifying…</p>}
        {resent && <p style={{ color: '#34d399', fontSize: 13, marginBottom: 16 }}>Code resent! ✓</p>}

        <div style={{ fontSize: 14, color: c.textTertiary }}>
          Didn't receive it?{' '}
          {countdown > 0
            ? <span>Resend in {countdown}s</span>
            : <span onClick={handleResend} style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}>Resend code</span>
          }
        </div>
      </div>
    </div>
  );
}