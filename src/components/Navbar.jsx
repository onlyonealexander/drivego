import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import styles from './Navbar.module.css';

export default function Navbar({ onAuthClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const dashboardPath = user?.role === 'owner' ? '/owner' : '/dashboard';

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
        Drive<span>GO</span>
      </Link>

      {/* Desktop actions */}
      <div className={styles.actions}>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user ? (
          <>
            <NotificationBell />
            {user?.role === 'admin' && (
              <Link to="/admin" className={styles.btnGhost}>⚙️ Admin</Link>
            )}
            <Link to="/chat" className={styles.btnGhost}>💬 Messages</Link>
            <Link to={dashboardPath} className={styles.btnGhost}>Dashboard</Link>
            <Link to="/profile" className={styles.btnGhost}>Profile</Link>
            <span className={styles.roleBadge}>
              {user.role === 'owner' ? '🔑 Car Owner' : '🚗 Renter'}
            </span>
            <button className={styles.btnGhost} onClick={handleLogout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <button className={styles.btnOutline} onClick={() => onAuthClick('list')}>
  List your car
</button>
            <button className={styles.btnPrimary} onClick={() => onAuthClick('signin')}>
              Sign in
            </button>
          </>
        )}
      </div>

      {/* Mobile right side */}
      <div className={styles.mobileRight}>
        <button className={styles.themeToggle} onClick={toggleTheme}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {user && <NotificationBell />}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {user ? (
            <>
              <div className={styles.mobileUser}>
                <div className={styles.mobileUserName}>{user.name}</div>
                <span className={styles.roleBadge}>
                  {user.role === 'owner' ? '🔑 Car Owner' : '🚗 Renter'}
                </span>
              </div>
              {user?.role === 'admin' && (
                <Link to="/admin" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                  ⚙️ Admin
                </Link>
              )}
              <Link to={dashboardPath} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                📊 Dashboard
              </Link>
              <Link to="/chat" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                💬 Messages
              </Link>
              <Link to="/profile" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                👤 Profile
              </Link>
              <Link to="/contact" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                📧 Contact
              </Link>
              <button className={styles.mobileSignOut} onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.mobileLink}
                onClick={() => { onAuthClick('list'); setMenuOpen(false); }}
              >
                🔑 List your car
              </button>
              <button
                className={styles.mobilePrimary}
                onClick={() => { onAuthClick('signin'); setMenuOpen(false); }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}