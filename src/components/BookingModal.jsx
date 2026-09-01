import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../lib/db';
import styles from './BookingModal.module.css';

const TYPE_EMOJI = { Sedan: '🚗', SUV: '🚙', Luxury: '🏎️', Van: '🚐' };

export default function BookingModal({ car, onClose, onSuccess }) {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [agreed, setAgreed]       = useState(!car?.requirements);

  if (!car) return null;

  const days = startDate && endDate
    ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    : 0;

  const totalPrice  = days * car.price;
  const totalInKobo = totalPrice * 100;

  const handlePayment = () => {
    if (!startDate || !endDate) {
      setError('Please select pickup and return dates.');
      return;
    }
    if (days < 1) {
      setError('Return date must be after pickup date.');
      return;
    }
    if (!agreed) {
      setError('Please confirm you have read and agree to the requirements.');
      return;
    }
    setError('');

    const handler = window.PaystackPop.setup({
      key:       process.env.REACT_APP_PAYSTACK_KEY,
      email:     user?.email,
      amount:    totalInKobo,
      currency:  'NGN',
      ref:       `drivego_${Date.now()}`,
      metadata: {
        car_name:   car.name,
        renter:     user?.name,
        start_date: startDate.toISOString().split('T')[0],
        end_date:   endDate.toISOString().split('T')[0],
      },
      onClose: () => {
        setError('Payment was cancelled. Please try again.');
      },
      callback: (response) => {
        handlePaymentSuccess(response);
      },
    });

    handler.openIframe();
  };

  const handlePaymentSuccess = async (response) => {
    setLoading(true);
    try {
      await createBooking({
        car_id:      car.id,
        renter_id:   user.id,
        owner_id:    car.owner_id,
        start_date:  startDate.toISOString().split('T')[0],
        end_date:    endDate.toISOString().split('T')[0],
        total_price: totalPrice,
        status:      'pending',
        payment_ref: response.reference,
        requirements_agreed: true,
      });
      setConfirmed(true);
    } catch (err) {
      setError('Payment received but booking failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (date) => date?.toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>×</button>

        {confirmed ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>🎉</div>
            <h2 className={styles.successTitle}>Payment received!</h2>
            <p className={styles.successSub}>
              Your request for <strong>{car.name}</strong> is now pending the owner's
              confirmation. You'll be notified as soon as they accept and again when
              the car is dispatched to you.
            </p>
            <div className={styles.successDetails}>
              <div className={styles.detailRow}>
                <span>Pickup</span><span>{fmt(startDate)}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Return</span><span>{fmt(endDate)}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Duration</span><span>{days} day{days !== 1 ? 's' : ''}</span>
              </div>
              <div className={`${styles.detailRow} ${styles.totalRow}`}>
                <span>Total paid</span>
                <span>₦{totalPrice.toLocaleString()}</span>
              </div>
            </div>
            <button className={styles.doneBtn} onClick={onSuccess || onClose}>
              View my bookings
            </button>
          </div>
        ) : (
          <>
            <div className={styles.carInfo}>
              <div className={styles.carEmoji}>
                {car.image_url
                  ? <img src={car.image_url} alt={car.name} className={styles.carImg} />
                  : <span>{TYPE_EMOJI[car.type] || '🚗'}</span>
                }
              </div>
              <div>
                <div className={styles.carName}>{car.name}</div>
                <div className={styles.carMeta}>{car.type} · {car.city} · {car.year}</div>
                <div className={styles.carPrice}>
                  ₦{Number(car.price).toLocaleString()} <span>/ day</span>
                </div>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.dates}>
              <div className={styles.dateField}>
                <label className={styles.label}>📅 Pickup date</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    if (endDate && date >= endDate) setEndDate(null);
                  }}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  minDate={new Date()}
                  placeholderText="Select date"
                  className={styles.datePicker}
                  dateFormat="dd MMM yyyy"
                />
              </div>
              <div className={styles.dateArrow}>→</div>
              <div className={styles.dateField}>
                <label className={styles.label}>📅 Return date</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || new Date()}
                  placeholderText="Select date"
                  className={styles.datePicker}
                  dateFormat="dd MMM yyyy"
                  disabled={!startDate}
                />
              </div>
            </div>

            {car.requirements && (
              <div className={styles.breakdown} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>📋 Owner's requirements</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', marginBottom: 10 }}>
                  {car.requirements}
                </p>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ marginTop: 2 }}
                  />
                  I have read and agree to these requirements
                </label>
              </div>
            )}

            {days > 0 && (
              <div className={styles.breakdown}>
                <div className={styles.breakdownRow}>
                  <span>₦{Number(car.price).toLocaleString()} × {days} day{days !== 1 ? 's' : ''}</span>
                  <span>₦{totalPrice.toLocaleString()}</span>
                </div>
                <div className={styles.breakdownRow} style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  <span>Service fee</span>
                  <span>Free</span>
                </div>
                <div className={styles.divider} />
                <div className={`${styles.breakdownRow} ${styles.totalRow}`}>
                  <span>Total</span>
                  <span>₦{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.confirmBtn}
              onClick={handlePayment}
              disabled={loading || !startDate || !endDate || !agreed}
            >
              {loading
                ? 'Processing...'
                : days > 0
                ? `Pay ₦${totalPrice.toLocaleString()} with Paystack`
                : 'Select dates to continue'}
            </button>

            <div className={styles.paystackBadge}>
              🔒 Secured by <strong>Paystack</strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}