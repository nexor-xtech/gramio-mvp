import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters');
    }
    if (form.username.length < 3) {
      return setError('Username must be at least 3 characters');
    }

    setLoading(true);
    try {
      await signup(form.email, form.password, form.username);
      navigate('/flow');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Logo */}
        <div style={styles.logoSection}>
          <Logo size={72} />
          <h1 style={styles.appName}>GramIO</h1>
          <p style={styles.tagline}>Join the flow today.</p>
        </div>

        {/* Error */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputWrapper}>
            <input
              style={styles.input}
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="off"
            />
          </div>
          <div style={styles.inputWrapper}>
            <input
              style={styles.input}
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div style={styles.inputWrapper}>
            <input
              style={styles.input}
              type="password"
              name="password"
              placeholder="Password (min 8 characters)"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password strength indicator */}
          {form.password.length > 0 && (
            <div style={styles.strengthRow}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    ...styles.strengthBar,
                    background:
                      form.password.length >= i * 3
                        ? i <= 1
                          ? '#ed4956'
                          : i === 2
                          ? '#f4a522'
                          : i === 3
                          ? '#4caf50'
                          : 'var(--accent-gold)'
                        : 'var(--border-color)',
                  }}
                />
              ))}
              <span style={styles.strengthLabel}>
                {form.password.length < 4
                  ? 'Weak'
                  : form.password.length < 7
                  ? 'Fair'
                  : form.password.length < 10
                  ? 'Good'
                  : 'Strong'}
              </span>
            </div>
          )}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Terms */}
        <p style={styles.terms}>
          By signing up you agree to our{' '}
          <span style={styles.termLink}>Terms</span> and{' '}
          <span style={styles.termLink}>Privacy Policy</span>.
        </p>

        {/* Divider */}
        <div style={styles.dividerRow}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>OR</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Login link */}
        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Log in</Link>
        </p>

        {/* Powered by */}
        <div style={styles.poweredBy}>
          <span style={styles.poweredByText}>Powered by </span>
          <span style={styles.poweredByBrand}>NuxorexTech</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  container: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    paddingBottom: '60px',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  appName: {
    fontFamily: 'serif',
    fontSize: '42px',
    fontWeight: 'bold',
    color: 'var(--accent-gold)',
    margin: 0,
    letterSpacing: '2px',
  },
  tagline: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: 0,
    letterSpacing: '1px',
  },
  error: {
    width: '100%',
    background: 'rgba(237, 73, 86, 0.1)',
    border: '1px solid var(--danger)',
    color: 'var(--danger)',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '13px',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inputWrapper: {
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    fontSize: '15px',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  strengthRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '-4px',
  },
  strengthBar: {
    flex: 1,
    height: '3px',
    borderRadius: '2px',
    transition: 'background 0.3s',
  },
  strengthLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    width: '40px',
    textAlign: 'right',
    flexShrink: 0,
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'var(--accent-gold)',
    color: '#000',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    marginTop: '4px',
  },
  terms: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    margin: 0,
    lineHeight: '1.6',
  },
  termLink: {
    color: 'var(--accent-gold)',
    cursor: 'pointer',
  },
  dividerRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'var(--border-color)',
  },
  dividerText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    letterSpacing: '1px',
  },
  switchText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  link: {
    color: 'var(--accent-gold)',
    textDecoration: 'none',
    fontWeight: '600',
  },
  poweredBy: {
    position: 'fixed',
    bottom: '20px',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  poweredByText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  poweredByBrand: {
    fontSize: '12px',
    color: 'var(--accent-gold)',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
};

export default Signup;