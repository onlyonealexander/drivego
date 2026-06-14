import { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import styles from './ContactPage.module.css';

const faqs = [
  { q: 'How do I book a car?', a: 'Create a free renter account, browse available cars, pick your dates and click Book Now. Pay securely with Paystack and the owner will be notified immediately.' },
  { q: 'How do I list my car?', a: 'Sign up as a Car Owner, go to your dashboard and click "Add a car". Fill in the details, upload photos and set your daily price.' },
  { q: 'Is my car insured while rented out?', a: 'Yes. All trips on DriveGO are covered by our partner insurance from the moment a booking is confirmed.' },
  { q: 'How do I get paid as an owner?', a: 'Earnings are paid directly to your bank account within 24 hours after each completed trip.' },
  { q: 'What if there is damage to the car?', a: 'Report it through the app within 24 hours of the trip ending. Our team will investigate and insurance will cover eligible claims.' },
];

export default function ContactPage() {
  const formRef = useRef();
  const [form, setForm]     = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent]     = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError]   = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setSending(true);
    setError('');

    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          from_name:  form.name,
          from_email: form.email,
          subject:    form.subject || 'General enquiry',
          message:    form.message,
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );
      setSent(true);
    } catch (err) {
      setError('Failed to send message. Please try again or email us directly.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
   <main className={styles.main} style={{ animation: 'fadeInUp 0.35s ease' }}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.tag}>Support & Contact</div>
        <h1 className={styles.heading}>We're here to <em>help.</em></h1>
        <p className={styles.sub}>
          Questions about a booking, listing your car, or anything else?
          Reach out and we'll get back to you within a few hours.
        </p>
      </section>

      <div className={styles.body}>
        {/* Channel cards */}
        <div className={styles.channels}>
          <div className={styles.channel}>
            <div className={styles.channelIcon}>📧</div>
            <div className={styles.channelLabel}>Email us</div>
            <a href="mailto:hello@drivego.ng" className={styles.channelValue}>
              hello@drivego.ng
            </a>
          </div>
          <div className={styles.channel}>
            <div className={styles.channelIcon}>📞</div>
            <div className={styles.channelLabel}>Call us</div>
            <a href="tel:+2348000000000" className={styles.channelValue}>
              +234 800 000 0000
            </a>
          </div>
          <div className={styles.channel}>
            <div className={styles.channelIcon}>💬</div>
            <div className={styles.channelLabel}>WhatsApp</div>
            <a href="https://wa.me/2348000000000" className={styles.channelValue}
              target="_blank" rel="noreferrer">
              Chat now
            </a>
          </div>
          <div className={styles.channel}>
            <div className={styles.channelIcon}>🕐</div>
            <div className={styles.channelLabel}>Support hours</div>
            <span className={styles.channelValue}>Mon–Sat, 8am–8pm</span>
          </div>
        </div>

        <div className={styles.cols}>
          {/* Contact Form */}
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Send a message</h2>

            {sent ? (
              <div className={styles.successBox}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <div className={styles.successTitle}>Message sent!</div>
                <p className={styles.successSub}>
                  We've received your message and will reply to{' '}
                  <strong>{form.email}</strong> within a few hours.
                </p>
                <button
                  className={styles.resetBtn}
                  onClick={() => {
                    setSent(false);
                    setForm({ name: '', email: '', subject: '', message: '' });
                  }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                {error && <p className={styles.errorMsg}>{error}</p>}

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full name *</label>
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="John Adeyemi"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Email address *</label>
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Subject</label>
                  <select
                    className={styles.input}
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  >
                    <option value="">Select a topic...</option>
                    <option>Booking issue</option>
                    <option>Listing my car</option>
                    <option>Payment / earnings</option>
                    <option>Insurance & damage</option>
                    <option>Account problem</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Message *</label>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    placeholder="Tell us what's on your mind..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={5}
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={sending}
                >
                  {sending ? 'Sending...' : 'Send message →'}
                </button>
              </form>
            )}
          </section>

          {/* FAQ */}
          <section className={styles.faqSection}>
            <h2 className={styles.sectionTitle}>Frequently asked</h2>
            <div className={styles.faqList}>
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}
                >
                  <button
                    className={styles.faqQ}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <span className={styles.faqChevron}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <div className={styles.faqA}>{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}