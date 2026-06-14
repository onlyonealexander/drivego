import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logo}>Drive<span>GO</span></div>
          <p className={styles.tagline}>
            Nigeria's peer-to-peer car rental platform. Rent from real owners,
            earn from your car.
          </p>
          <div className={styles.socials}>
            <a href="#" className={styles.social} aria-label="Twitter">𝕏</a>
            <a href="#" className={styles.social} aria-label="Instagram">📸</a>
            <a href="#" className={styles.social} aria-label="Facebook">f</a>
            <a href="#" className={styles.social} aria-label="WhatsApp">💬</a>
          </div>
        </div>

        {/* Links */}
        <div className={styles.col}>
          <div className={styles.colTitle}>Company</div>
          <Link to="/" className={styles.link}>About us</Link>
          <Link to="/" className={styles.link}>How it works</Link>
          <Link to="/" className={styles.link}>Blog</Link>
          <Link to="/" className={styles.link}>Careers</Link>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>For Renters</div>
          <Link to="/" className={styles.link}>Browse cars</Link>
          <Link to="/" className={styles.link}>How to book</Link>
          <Link to="/" className={styles.link}>Insurance & safety</Link>
          <Link to="/" className={styles.link}>Cancellation policy</Link>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>For Owners</div>
          <Link to="/" className={styles.link}>List your car</Link>
          <Link to="/" className={styles.link}>Earnings calculator</Link>
          <Link to="/" className={styles.link}>Owner protection</Link>
          <Link to="/" className={styles.link}>Owner FAQs</Link>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Contact</div>
          <a href="mailto:hello@drivego.ng" className={styles.link}>hello@drivego.ng</a>
          <a href="tel:+2348000000000" className={styles.link}>+234 800 000 0000</a>
          <a href="#" className={styles.link}>WhatsApp support</a>
          <Link to="/contact" className={styles.link}>Send a message</Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <span className={styles.copy}>© {new Date().getFullYear()} DriveGO. All rights reserved.</span>
        <div className={styles.legal}>
          <a href="#" className={styles.legalLink}>Privacy Policy</a>
          <a href="#" className={styles.legalLink}>Terms of Service</a>
          <a href="#" className={styles.legalLink}>Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
}
