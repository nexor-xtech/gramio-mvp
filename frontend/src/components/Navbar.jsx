import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/flow" style={styles.logoLink}>
          <Logo size={32} />
          <span style={styles.logoText}>GramIO</span>
        </Link>

        {/* Right side */}
        {user && (
          <div style={styles.right} className="navbar-links">
            <Link to="/flow" style={styles.navLink}>
              🏠<span className="navbar-link-text"> Flow</span>
            </Link>
            <Link to="/search" style={styles.navLink}>
              🔍<span className="navbar-link-text"> Search</span>
            </Link>
            <Link to="/messages" style={styles.navLink}>
              💬<span className="navbar-link-text"> Messages</span>
            </Link>
            <Link to={`/profile/${profile?.username}`} style={styles.navLink}>
              👤<span className="navbar-link-text"> Profile</span>
            </Link>
            <Link to="/settings" style={styles.navLink}>
              ⚙️<span className="navbar-link-text"> Settings</span>
            </Link>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              ⎋<span className="navbar-link-text"> Log out</span>
            </button>

            {/* Avatar */}
            <Link to={`/profile/${profile?.username}`}>
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="avatar"
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {profile?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    zIndex: 100,
  },
  inner: {
    maxWidth: '935px',
    margin: '0 auto',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: 'serif',
    fontSize: '22px',
    fontWeight: 'bold',
    color: 'var(--accent-gold)',
    whiteSpace: 'nowrap',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    overflowX: 'auto',
  },
  navLink: {
    textDecoration: 'none',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    padding: 0,
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--accent-gold)',
    flexShrink: 0,
  },
  avatarPlaceholder: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    flexShrink: 0,
  },
};

export default Navbar;