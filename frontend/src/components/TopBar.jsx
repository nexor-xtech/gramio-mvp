import { Link } from 'react-router-dom';
import Logo from './Logo';

const TopBar = ({ title }) => {
  return (
    <div style={styles.bar}>
      <div style={styles.inner}>
        <Link to="/flow" style={styles.logoLink}>
          <Logo size={28} />
          <span style={styles.logoText}>GramIO</span>
        </Link>

        {title && (
          <span style={{
            position: 'absolute',
            left: '50%',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            marginLeft: '-60px',
          }}>
            {title}
          </span>
        )}

        <div style={styles.right}>
          <Link to="/notifications" style={styles.iconBtn} title="Notifications">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                fill="var(--text-primary)"
              />
            </svg>
          </Link>
          <Link to="/messages" style={styles.iconBtn} title="Messages">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
                fill="var(--text-primary)"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  bar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '56px',
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
    position: 'relative',
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
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'var(--accent-gold)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    padding: '4px',
  },
};

export default TopBar;