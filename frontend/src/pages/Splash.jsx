import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const Splash = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (user) {
        navigate('/flow', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return (
    <div style={styles.page}>
      {/* Background pattern */}
      <div style={styles.bgPattern} />

      {/* Top decorative line */}
      <div style={styles.topLine} />

      {/* Main content */}
      <div style={styles.content}>

        {/* Logo */}
        <div style={styles.logoWrapper}>
          <div style={styles.logoGlow} />
          <Logo size={100} />
        </div>

        {/* App name */}
        <div style={styles.nameWrapper}>
          <h1 style={styles.appName}>GramIO</h1>
          <div style={styles.nameLine} />
        </div>

        {/* Tagline */}
        <p style={styles.tagline}>Connect. Share. Flow.</p>

        {/* Loading dots */}
        <div style={styles.dotsRow}>
          <div style={{ ...styles.dot, animationDelay: '0s' }} />
          <div style={{ ...styles.dot, animationDelay: '0.2s' }} />
          <div style={{ ...styles.dot, animationDelay: '0.4s' }} />
        </div>
      </div>

      {/* Bottom section */}
      <div style={styles.bottom}>
        <div style={styles.poweredRow}>
          <div style={styles.poweredLine} />
          <span style={styles.poweredText}>Powered by</span>
          <div style={styles.poweredLine} />
        </div>
        <span style={styles.brandName}>NexorXTech</span>
        <span style={styles.version}>v1.0.0</span>
      </div>

      {/* Bottom decorative line */}
      <div style={styles.bottomLine} />

      <style>{`
        @keyframes splashDot {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashGlow {
          0%, 100% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes splashLine {
          from { width: 0; }
          to { width: 60px; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bgPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(circle at 20% 20%, rgba(212,175,55,0.04) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(212,175,55,0.04) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(212,175,55,0.02) 0%, transparent 70%)
    `,
    pointerEvents: 'none',
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: '-40px',
    width: '80px',
    height: '3px',
    background: 'linear-gradient(to right, transparent, #D4AF37, transparent)',
    borderRadius: '2px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    animation: 'splashFadeIn 0.8s ease forwards',
  },
  logoWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
    animation: 'splashGlow 2s ease-in-out infinite',
  },
  nameWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  appName: {
    fontFamily: 'serif',
    fontSize: '52px',
    fontWeight: '800',
    color: '#D4AF37',
    margin: 0,
    letterSpacing: '6px',
    textShadow: '0 0 40px rgba(212,175,55,0.3)',
  },
  nameLine: {
    height: '2px',
    background: 'linear-gradient(to right, transparent, #D4AF37, transparent)',
    borderRadius: '2px',
    animation: 'splashLine 1s ease 0.5s forwards',
    width: '0px',
  },
  tagline: {
    fontSize: '14px',
    color: 'rgba(212,175,55,0.6)',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    margin: 0,
    fontWeight: '300',
  },
  dotsRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#D4AF37',
    animation: 'splashDot 1s ease-in-out infinite',
  },
  bottom: {
    position: 'absolute',
    bottom: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  poweredRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  poweredLine: {
    width: '30px',
    height: '1px',
    background: 'rgba(212,175,55,0.3)',
  },
  poweredText: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  brandName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: '2px',
  },
  version: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: '1px',
  },
  bottomLine: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: '-40px',
    width: '80px',
    height: '3px',
    background: 'linear-gradient(to right, transparent, #D4AF37, transparent)',
    borderRadius: '2px',
  },
};

export default Splash;