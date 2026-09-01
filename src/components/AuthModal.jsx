import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import styles from './AuthModal.module.css';

export default function AuthModal({ isOpen, onClose, intent }) {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState(intent === 'list' ? 'signup' : 'login');
  const [signupRole, setSignupRole] = useState(intent === 'list' ? 'owner' : 'renter');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass]   = useState('');
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [city, setCity]             = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState('');

  if (!isOpen) return null;

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      setError('Enter your email above first, then click "Forgot password?".');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
      setSuccess('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPass) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await login(loginEmail, loginPass);

      // Read role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const role = profile?.role || 'renter';
      onClose();
      navigate(role === 'owner' ? '/owner' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (signupRole === 'owner' && !city) {
      setError('Please enter your city.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signup(email, password, name, signupRole, city);
      setSuccess('Account created! Please sign in.');
      setTab('login');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>×</button>

        <div className={styles.brand}>Drive<span>GO</span></div>
        <p className={styles.sub}>
          {intent === 'book'
            ? '🔒 You need an account to book a car'
            : tab === 'login' ? 'Welcome back' : 'Create your account'}
        </p>

        {intent === 'book' && (
          <div className={styles.alert}>
            Sign in or create an account to complete your booking.
          </div>
        )}

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'login' ? styles.active : ''}`}
            onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
          >
            Sign in
          </button>
          <button
            className={`${styles.tab} ${tab === 'signup' ? styles.active : ''}`}
            onClick={() => { setTab('signup'); setError(''); setSuccess(''); }}
          >
            Create account
          </button>
        </div>

        {error   && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.successMsg}>{success}</p>}

        {/* ── LOGIN — no role toggle ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} noValidate>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
              />
            </div>
            <p className={styles.forgot} onClick={handleForgotPassword}>Forgot password?</p>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
        )}

        {/* ── SIGNUP — role toggle only here ── */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} noValidate>
            <div className={styles.roleLabel}>I want to</div>
            <div className={styles.roleGrid}>
              <button
                type="button"
                className={`${styles.roleBtn} ${signupRole === 'renter' ? styles.roleSelected : ''}`}
                onClick={(e) => { e.preventDefault(); setSignupRole('renter'); }}
              >
                <span className={styles.roleIcon}>🚗</span>
                Rent a car
              </button>
              <button
                type="button"
                className={`${styles.roleBtn} ${signupRole === 'owner' ? styles.roleSelected : ''}`}
                onClick={(e) => { e.preventDefault(); setSignupRole('owner'); }}
              >
                <span className={styles.roleIcon}>🔑</span>
                List my car
              </button>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Full name</label>
              <input
                className={styles.input}
                type="text"
                placeholder="John Adeyemi"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone</label>
              <input
                className={styles.input}
                type="tel"
                placeholder="+234 800 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {signupRole === 'owner' && (
              <div className={styles.field}>
                <label className={styles.label}>City / Location</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Lagos, Abuja..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            )}
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>
        )}

        <p className={styles.switchHint}>
          {tab === 'login'
            ? <> No account? <span onClick={() => { setTab('signup'); setError(''); }}>Sign up free</span></>
            : <> Already have one? <span onClick={() => { setTab('login'); setError(''); }}>Sign in</span></>
          }
        </p>
      </div>
    </div>
  );
}