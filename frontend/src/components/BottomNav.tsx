import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const path = location.pathname;

  const tabs = [
    {
      to: '/flow',
      label: 'Flow',
      active: path === '/flow',
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
            fill={active ? 'var(--accent-gold)' : 'var(--text-secondary)'}
          />
        </svg>
      ),
    },
    {
      to: '/reels',
      label: 'Reels',
      active: path === '/reels',
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M8 5v14l11-7z"
            fill={active ? 'var(--accent-gold)' : 'var(--text-secondary)'}
          />
        </svg>
      ),
    },
    {
      to: '/pulse',
      label: 'Pulse',
      active: path === '/pulse',
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"
            fill={active ? 'var(--accent-gold)' : 'var(--text-secondary)'}
          />
        </svg>
      ),
    },
    {
      to: '/search',
      label: 'Search',
      active: path === '/search',
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            fill={active ? 'var(--accent-gold)' : 'var(--text-secondary)'}
          />
        </svg>
      ),
    },
    {
      to: `/profile/${profile?.username}`,
      label: 'You',
      active: path.startsWith('/profile'),
      icon: (active) => (
        profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt="you"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: active ? '2px solid var(--accent-gold)' : '2px solid var(--border-color)',
            }}
          />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              fill={active ? 'var(--accent-gold)' : 'var(--text-secondary)'}
            />
          </svg>
        )
      ),
    },
  ];

  return (
    <nav style={styles.nav}>
      {tabs.map((tab) => (
        <Link key={tab.to} to={tab.to} style={styles.tab}>
          <div style={styles.icon}>{tab.icon(tab.active)}</div>
          <span
            style={{
              ...styles.label,
              color: tab.active ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontWeight: tab.active ? '600' : '400',
            }}
          >
            {tab.label}
          </span>
        </Link>
      ))}
    </nav>
  );
};

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    textDecoration: 'none',
    flex: 1,
    height: '100%',
    padding: '4px 0',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '26px',
  },
  label: {
    fontSize: '10px',
    letterSpacing: '0.02em',
  },
};

export default BottomNav;