import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import styles from './ReviewModal.module.css';

export default function ReviewModal({ booking, onClose, onSuccess }) {
  const { user } = useAuth();
  const [rating, setRating]   = useState(0);
  const [hover, setHover]     = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  if (!booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Insert review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert([{
          car_id:    booking.car_id,
          renter_id: user.id,
          rating,
          comment,
        }]);

      if (reviewError) throw reviewError;

      // Mark booking as reviewed
      await supabase
        .from('bookings')
        .update({ reviewed: true })
        .eq('id', booking.id);

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  const labels = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent'];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>×</button>

        <div className={styles.header}>
          <div className={styles.icon}>⭐</div>
          <h2 className={styles.title}>Rate your experience</h2>
          <p className={styles.sub}>
            How was your trip with <strong>{booking.cars?.name}</strong>?
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star rating */}
          <div className={styles.starsWrap}>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.star} ${(hover || rating) >= star ? styles.starActive : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                >
                  ★
                </button>
              ))}
            </div>
            {(hover || rating) > 0 && (
              <div className={styles.ratingLabel}>
                {labels[hover || rating]}
              </div>
            )}
          </div>

          {/* Comment */}
          <div className={styles.field}>
            <label className={styles.label}>Comment (optional)</label>
            <textarea
              className={styles.textarea}
              placeholder="Tell others about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || rating === 0}
          >
            {loading ? 'Submitting...' : 'Submit review →'}
          </button>
        </form>
      </div>
    </div>
  );
}