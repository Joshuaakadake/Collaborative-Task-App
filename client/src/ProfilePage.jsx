import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function ProfilePage({ user, onBack, onUpdate }) {
  const [profile, setProfile] = useState({
    fullName: user?.username || '',
    bio: '',
    department: '',
    role: '',
    avatar: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  // Load saved avatar on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem(`avatar_${user?.id}`);
    if (savedAvatar) {
      setAvatarPreview(savedAvatar);
      setProfile(prev => ({ ...prev, avatar: savedAvatar }));
    }
  }, [user?.id]);

  const colors = {
    bg: '#0a0a0f',
    surface: '#13131a',
    surface2: '#1c1c26',
    border: 'rgba(255,255,255,0.08)',
    textPrimary: '#f5f5f7',
    textSecondary: '#a1a1b5',
    accent: '#7c6af5',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: colors.surface2,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    color: colors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    marginBottom: '12px',
    fontFamily: 'Inter, sans-serif',
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const avatarData = ev.target.result;
        setAvatarPreview(avatarData);
        setEditedProfile({ ...editedProfile, avatar: avatarData });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setProfile(editedProfile);
    setIsEditing(false);
    
    // Save avatar to localStorage
    if (editedProfile.avatar) {
      localStorage.setItem(`avatar_${user?.id}`, editedProfile.avatar);
    }
    
    // Update parent component
    if (onUpdate) {
      onUpdate({ ...user, avatar: editedProfile.avatar });
    }
    
    setMessage('Profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
    
    try {
      await axios.put('/api/profile', editedProfile);
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const getInitials = () => {
    const name = editedProfile.fullName || user?.username || 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, padding: '40px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: colors.accent, cursor: 'pointer', marginBottom: '24px', fontSize: '14px' }}>
          ← Back to Dashboard
        </button>

        {message && (
          <div style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '10px', padding: '10px', marginBottom: '16px', color: '#34d399', fontSize: '13px', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '32px' }}>
          {/* Avatar Section */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div 
              onClick={() => isEditing && fileInputRef.current?.click()}
              style={{ cursor: isEditing ? 'pointer' : 'default', position: 'relative' }}
            >
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: avatarPreview ? 'transparent' : `linear-gradient(135deg, ${colors.accent}, #a89ef8)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: '40px', fontWeight: '700',
                overflow: 'hidden', border: `3px solid ${colors.accent}`,
              }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials()
                )}
              </div>
              {isEditing && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: colors.accent }}>
                  Click avatar to change photo
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </div>
            <h2 style={{ fontSize: '22px', color: colors.textPrimary }}>{user?.username}</h2>
            <p style={{ color: colors.textSecondary, fontSize: '13px' }}>{user?.email}</p>
          </div>

          {/* Profile Info */}
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: colors.textPrimary, fontSize: '18px' }}>Profile Information</h3>
              {!isEditing && (
                <button onClick={() => { setIsEditing(true); setEditedProfile(profile); }} style={{ background: colors.accent, border: 'none', borderRadius: '8px', padding: '6px 16px', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <>
                <label style={{ fontSize: '13px', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input type="text" value={editedProfile.fullName} onChange={e => setEditedProfile({ ...editedProfile, fullName: e.target.value })} style={inputStyle} />

                <label style={{ fontSize: '13px', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Bio</label>
                <textarea value={editedProfile.bio} onChange={e => setEditedProfile({ ...editedProfile, bio: e.target.value })} rows="3" style={{ ...inputStyle, resize: 'vertical' }} placeholder="Tell us about yourself..." />

                <label style={{ fontSize: '13px', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Department</label>
                <input type="text" value={editedProfile.department} onChange={e => setEditedProfile({ ...editedProfile, department: e.target.value })} style={inputStyle} placeholder="e.g., Engineering, Design, Product" />

                <label style={{ fontSize: '13px', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Role</label>
                <input type="text" value={editedProfile.role} onChange={e => setEditedProfile({ ...editedProfile, role: e.target.value })} style={inputStyle} placeholder="e.g., Manager, Developer, Lead" />

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.textSecondary, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSave} style={{ flex: 1, padding: '10px', background: colors.accent, border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Save Changes</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: colors.textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
                  <p style={{ color: colors.textPrimary, marginTop: '4px', fontSize: '15px' }}>{profile.fullName || 'Not set'}</p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: colors.textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bio</label>
                  <p style={{ color: colors.textPrimary, marginTop: '4px', fontSize: '14px' }}>{profile.bio || 'No bio added yet'}</p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: colors.textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</label>
                  <p style={{ color: colors.textPrimary, marginTop: '4px', fontSize: '14px' }}>{profile.department || 'Not specified'}</p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: colors.textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</label>
                  <p style={{ color: colors.textPrimary, marginTop: '4px', fontSize: '14px' }}>{profile.role || 'Not specified'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}