import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProfilePage({ user, onBack, dark = true }) {
  const [profile, setProfile] = useState({
    fullName: user?.username || '',
    bio: '',
    department: '',
    role: '',
    avatar: null
  });
  const [editing, setEditing] = useState(false);

  const colors = {
    bg: '#0a0a0f',
    surface: '#13131a',
    surface2: '#1c1c26',
    border: 'rgba(255,255,255,0.08)',
    textPrimary: '#f5f5f7',
    textSecondary: '#a1a1b5',
    accent: '#7c6af5',
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, padding: '40px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: colors.accent, cursor: 'pointer', marginBottom: '24px' }}>← Back to Dashboard</button>
        
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.accent}, #a89ef8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>
              {user?.username?.charAt(0)?.toUpperCase()}
            </div>
            <h2 style={{ fontSize: '24px', color: colors.textPrimary }}>{user?.username}</h2>
            <p style={{ color: colors.textSecondary }}>{user?.email}</p>
          </div>

          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '24px' }}>
            <h3 style={{ color: colors.textPrimary, marginBottom: '16px' }}>Profile Info</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: colors.textSecondary, fontSize: '12px' }}>Full Name</label>
              <p style={{ color: colors.textPrimary }}>{profile.fullName || 'Not set'}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: colors.textSecondary, fontSize: '12px' }}>Bio</label>
              <p style={{ color: colors.textPrimary }}>{profile.bio || 'No bio added yet'}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: colors.textSecondary, fontSize: '12px' }}>Department</label>
              <p style={{ color: colors.textPrimary }}>{profile.department || 'Not specified'}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: colors.textSecondary, fontSize: '12px' }}>Role</label>
              <p style={{ color: colors.textPrimary }}>{profile.role || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}