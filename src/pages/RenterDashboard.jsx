import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRenterBookings } from '../lib/db';
import ReviewModal from '../components/ReviewModal';
import styles from './RenterDashboard.module.css';

export default function RenterDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewOpen, setReviewOpen]     = useState(false);

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getRenterBookings(user.id);
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmed  = bookings.filter((b) => b.status === 'confirmed');
  const pending    = bookings.filter((b) => b.status === 'pending');

  const statusStyle = {
    confirmed: styles.confirmed,
    pending:   styles.pending,
    declined:  styles.declined,
    completed: styles.completed,
  };

  const statusLabel = {
    confirmed: '✓ Confirmed',
    pending:   '⏳ Pending',
    declined:  '✕ Declined',
    completed: '✓ Completed',
  };

  return (
    <>
   <main className={styles.main} style={{ animation: 'fadeInUp 0.35s ease' }}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>
              Welcome back, <span>{user?.name}</span> 👋
            </h1>
            <p className={styles.greetingSub}>Ready to hit the road?</p>
          </div>
          <span className={styles.badge}>🚗 Renter</span>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Total bookings</div>
            <div className={styles.statValue}>{bookings.length}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Confirmed</div>
            <div className={styles.statValue}>{confirmed.length}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}>Pending</div>
            <div className={styles.statValue}>{pending.length}</div>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your bookings</h2>
          {loading ? (
            <p className={styles.empty}>Loading...</p>
          ) : bookings.length === 0 ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🚗</div>
              <p>No bookings yet. Browse cars and make your first booking!</p>
            </div>
          ) : (
            <div className={styles.bookingList}>
              {bookings.map((b) => (
                <div key={b.id} className={styles.bookingItem}>
                  <div className={styles.bookingLeft}>
                    {b.cars?.image_url
                      ? <img src={b.cars.image_url} alt={b.cars?.name} className={styles.bookingImg} />
                      : <div className={styles.bookingImgPlaceholder}>🚗</div>
                    }
                    <div>
                      <div className={styles.bookingCar}>{b.cars?.name || 'Car'}</div>
                      <div className={styles.bookingDate}>
                        {b.start_date} → {b.end_date}
                      </div>
                      <div className={styles.bookingPrice}>
                        ₦{Number(b.total_price).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className={styles.bookingRight}>
                    <span className={`${styles.pill} ${statusStyle[b.status] || styles.pending}`}>
                      {statusLabel[b.status] || b.status}
                    </span>
                    {/* Show review button for completed unreviewed bookings */}
                    {b.status === 'completed' && !b.reviewed && (
                      <button
                        className={styles.reviewBtn}
                        onClick={() => {
                          setSelectedBooking(b);
                          setReviewOpen(true);
                        }}
                      >
                        ⭐ Leave review
                      </button>
                    )}
                    {b.status === 'completed' && b.reviewed && (
                      <span className={styles.reviewedTag}>✓ Reviewed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {reviewOpen && (
        <ReviewModal
          booking={selectedBooking}
          onClose={() => { setReviewOpen(false); setSelectedBooking(null); }}
          onSuccess={() => {
            setReviewOpen(false);
            setSelectedBooking(null);
            loadBookings();
          }}
        />
      )}
    </>
  );
}