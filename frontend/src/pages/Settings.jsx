import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  databases,
  APPWRITE_DATABASE_ID,
  COLLECTIONS,
  storage,
  BUCKET_ID,
  ID,
} from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';

const Settings = () => {
  const { user, profile, fetchProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: profile?.username || '',
    bio: profile?.bio || '',
    isPrivate: profile?.isPrivate || false,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    profile?.avatarUrl || null
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('profile');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      let avatarUrl = profile?.avatarUrl || '';

      if (avatarFile) {
        const uploaded = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          avatarFile
        );
        avatarUrl = storage
          .getFileView(BUCKET_ID, uploaded.$id)
          .toString();
      }

      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.PROFILES,
        user.$id,
        {
          username: form.username,
          bio: form.bio,
          isPrivate: form.isPrivate,
          avatarUrl,
        }
      );

      await fetchProfile(user.$id);
      setSuccess('Profile updated successfully!');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sections = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'privacy', label: '🔒 Privacy', icon: '🔒' },
    { id: 'account', label: '⚙️ Account', icon: '⚙️' },
  ];

  return (
    <div style={styles.page}>
      <TopBar title="Settings" />

      <div style={styles.container}>

        {/* Section tabs */}
        <div style={styles.sectionTabs}>
          {sections.map((s) => (
            <button
              key={s.id}
              style={{
                ...styles.sectionTab,
                background:
                  activeSection === s.id
                    ? 'rgba(212,175,55,0.1)'
                    : 'transparent',
                color:
                  activeSection === s.id
                    ? 'var(--accent-gold)'
                    : 'var(--text-secondary)',
                border:
                  activeSection === s.id
                    ? '1px solid var(--accent-gold)'
                    : '1px solid var(--border-color)',
              }}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Profile section */}
        {activeSection === 'profile' && (
          <div style={styles.section}>

            {/* Avatar */}
            <div style={styles.avatarSection}>
              <div style={styles.avatarWrapper}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar"
                    style={styles.avatar}
                  />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    {profile?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <label style={styles.avatarEditBtn}>
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <div style={styles.avatarInfo}>
                <span style={styles.avatarUsername}>
                  @{profile?.username}
                </span>
                <label style={styles.changePhotoLabel}>
                  Change profile photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Success / Error */}
            {success && (
              <div style={styles.successMsg}>
                ✓ {success}
              </div>
            )}
            {error && (
              <div style={styles.errorMsg}>
                ✕ {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Username</label>
                <input
                  style={styles.input}
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Bio</label>
                <textarea
                  style={styles.textarea}
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell the world about yourself..."
                  maxLength={255}
                />
                <span style={styles.charCount}>
                  {form.bio.length}/255
                </span>
              </div>

              <button
                type="submit"
                style={{
                  ...styles.saveBtn,
                  opacity: saving ? 0.7 : 1,
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : '✓ Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Privacy section */}
        {activeSection === 'privacy' && (
          <div style={styles.section}>
            <div style={styles.settingRow}>
              <div style={styles.settingInfo}>
                <span style={styles.settingTitle}>Private Account</span>
                <span style={styles.settingDesc}>
                  Only approved followers can see your posts
                </span>
              </div>
              <div
                style={{
                  ...styles.toggle,
                  background: form.isPrivate
                    ? 'var(--accent-gold)'
                    : 'var(--border-color)',
                }}
                onClick={() =>
                  setForm({ ...form, isPrivate: !form.isPrivate })
                }
              >
                <div
                  style={{
                    ...styles.toggleThumb,
                    marginLeft: form.isPrivate ? '22px' : '2px',
                  }}
                />
              </div>
            </div>

            <div style={styles.settingRow}>
              <div style={styles.settingInfo}>
                <span style={styles.settingTitle}>Show Activity Status</span>
                <span style={styles.settingDesc}>
                  Let others see when you're active
                </span>
              </div>
              <div style={{ ...styles.toggle, background: 'var(--accent-gold)' }}>
                <div style={{ ...styles.toggleThumb, marginLeft: '22px' }} />
              </div>
            </div>

            <div style={styles.settingRow}>
              <div style={styles.settingInfo}>
                <span style={styles.settingTitle}>Allow Message Requests</span>
                <span style={styles.settingDesc}>
                  Receive DMs from people you don't follow
                </span>
              </div>
              <div style={{ ...styles.toggle, background: 'var(--accent-gold)' }}>
                <div style={{ ...styles.toggleThumb, marginLeft: '22px' }} />
              </div>
            </div>

            <button
              style={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : '✓ Save Privacy Settings'}
            </button>
          </div>
        )}

        {/* Account section */}
        {activeSection === 'account' && (
          <div style={styles.section}>
            <div style={styles.accountInfo}>
              <div style={styles.accountRow}>
                <span style={styles.accountLabel}>Email</span>
                <span style={styles.accountValue}>{user?.email}</span>
              </div>
              <div style={styles.accountRow}>
                <span style={styles.accountLabel}>Account ID</span>
                <span style={styles.accountValue}>
                  {user?.$id?.slice(0, 12)}...
                </span>
              </div>
              <div style={styles.accountRow}>
                <span style={styles.accountLabel}>Member since</span>
                <span style={styles.accountValue}>
                  {new Date(user?.$createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div style={styles.dangerZone}>
              <span style={styles.dangerTitle}>Account Actions</span>

              <button style={styles.logoutBtn} onClick={handleLogout}>
                ⎋ Log Out
              </button>

              <button style={styles.dangerBtn}>
                🗑 Delete Account
              </button>
            </div>

            <div style={styles.poweredBy}>
              <span style={styles.poweredByText}>Powered by </span>
              <span style={styles.poweredByBrand}>NuxorexTech</span>
              <span style={styles.version}> · v1.0.0</span>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const styles = {
  page: {
    background: 'var(--bg-primary)',
    minHeight: '100vh',
  },
  container: {
    maxWidth: '614px',
    margin: '0 auto',
    paddingTop: '72px',
    paddingBottom: '80px',
    paddingLeft: '16px',
    paddingRight: '16px',
  },
  sectionTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  sectionTab: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '20px',
  },
  avatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid var(--accent-gold)',
  },
  avatarPlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'var(--bg-hover)',
    color: 'var(--accent-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    border: '3px solid var(--accent-gold)',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    cursor: 'pointer',
    border: '2px solid var(--bg-primary)',
  },
  avatarInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  avatarUsername: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  changePhotoLabel: {
    fontSize: '13px',
    color: 'var(--accent-gold)',
    fontWeight: '600',
    cursor: 'pointer',
  },
  successMsg: {
    background: 'rgba(76,175,80,0.1)',
    border: '1px solid #4caf50',
    color: '#4caf50',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
  },
  errorMsg: {
    background: 'rgba(237,73,86,0.1)',
    border: '1px solid var(--danger)',
    color: 'var(--danger)',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  input: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '15px',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  textarea: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '15px',
    color: 'var(--text-primary)',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  charCount: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    textAlign: 'right',
  },
  saveBtn: {
    background: 'var(--accent-gold)',
    color: '#000',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    marginTop: '4px',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    padding: '16px',
  },
  settingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  settingTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  settingDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  toggle: {
    width: '46px',
    height: '26px',
    borderRadius: '13px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  toggleThumb: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute',
    top: '2px',
    transition: 'margin-left 0.2s',
  },
  accountInfo: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  accountRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-color)',
  },
  accountLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  accountValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  dangerZone: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  dangerTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  logoutBtn: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  dangerBtn: {
    background: 'rgba(237,73,86,0.1)',
    color: 'var(--danger)',
    border: '1px solid var(--danger)',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  poweredBy: {
    textAlign: 'center',
    padding: '20px 0 0',
  },
  poweredByText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  poweredByBrand: {
    fontSize: '12px',
    color: 'var(--accent-gold)',
    fontWeight: '600',
  },
  version: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
};

export default Settings;