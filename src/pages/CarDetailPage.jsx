import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BookingModal from '../components/BookingModal';
import styles from './CarDetailPage.module.css';

const TYPE_EMOJI = { Sedan: '🚗', SUV: '🚙', Luxury: '🏎️', Van: '🚐' };

export default function CarDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [car, setCar]                 = useState(null);
  const [owner, setOwner]             = useState(null);
  const [reviews, setReviews]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    if (id) loadCar();
  }, [id]);

  const loadCar = async () => {
    setLoading(true);
    try {
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();

      if (carError || !carData) {
        setCar(null);
        setLoading(false);
        return;
      }

      setCar(carData);

      if (carData.owner_id) {
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('id, name, phone, city, avatar_url, role')
          .eq('id', carData.owner_id)
          .single();
        setOwner(ownerData);
      }

      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*, profiles(name, avatar_url)')
        .eq('car_id', id)
        .order('created_at', { ascending: false });

      setReviews(reviewData || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = () => {
    if (!user) {
      navigate('/');
    } else {
      setBookingOpen(true);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.loading}>⏳ Loading car details...</div>
      </main>
    );
  }

  if (!car) {
    return (
      <main className={styles.main}>
        <div className={styles.loading}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Car not found
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            This car may have been removed or is no longer available.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Browse other cars
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
    <main className={styles.main} style={{ animation: 'fadeInUp 0.35s ease' }}>
        <div className={styles.container}>

          {/* Back */}
          <button className={styles.back} onClick={() => navigate(-1)}>
            ← Back
          </button>

          <div className={styles.grid}>

            {/* ── LEFT ── */}
            <div className={styles.left}>

              {/* Image */}
              <div className={styles.imageWrap}>
                {car.image_url
                  ? <img src={car.image_url} alt={car.name} className={styles.image} />
                  : <div className={styles.imagePlaceholder}>
                      {TYPE_EMOJI[car.type] || '🚗'}
                    </div>
                }
                <span className={styles.typeBadge}>{car.type}</span>
                {!car.available && (
                  <span className={styles.unavailableBadge}>Currently Unavailable</span>
                )}
              </div>

              {/* Specs */}
              <div className={styles.specs}>
                <div className={styles.spec}>
                  <div className={styles.specIcon}>📅</div>
                  <div className={styles.specLabel}>Year</div>
                  <div className={styles.specValue}>{car.year || 'N/A'}</div>
                </div>
                <div className={styles.spec}>
                  <div className={styles.specIcon}>🚘</div>
                  <div className={styles.specLabel}>Type</div>
                  <div className={styles.specValue}>{car.type}</div>
                </div>
                <div className={styles.spec}>
                  <div className={styles.specIcon}>📍</div>
                  <div className={styles.specLabel}>City</div>
                  <div className={styles.specValue}>{car.city}</div>
                </div>
                <div className={styles.spec}>
                  <div className={styles.specIcon}>⭐</div>
                  <div className={styles.specLabel}>Rating</div>
                  <div className={styles.specValue}>{avgRating || 'New'}</div>
                </div>
              </div>

              {/* Description */}
              {car.description && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>About this car</h2>
                  <p className={styles.description}>{car.description}</p>
                </div>
              )}

              {/* Requirements */}
              {car.requirements && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>📋 Requirements to book</h2>
                  <p className={styles.description} style={{ whiteSpace: 'pre-wrap' }}>
                    {car.requirements}
                  </p>
                </div>
              )}

              {/* Owner */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Listed by</h2>
                <div className={styles.ownerCard}>
                  <div className={styles.ownerAvatar}>
                    {owner?.avatar_url
                      ? <img src={owner.avatar_url} alt={owner.name} className={styles.ownerAvatarImg} />
                      : <div className={styles.ownerInitials}>
                          {owner?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                    }
                  </div>
                  <div>
                    <div className={styles.ownerName}>{owner?.name || 'Car Owner'}</div>
                    <div className={styles.ownerCity}>📍 {owner?.city || car.city}</div>
                    <div className={styles.ownerRole}>
                      {owner?.role === 'owner' ? '🔑 Car Owner' : ''}
                    </div>
                  </div>
                  {user && user.id !== car.owner_id && (
                    <button
                      className={styles.msgOwnerBtnSmall}
                      onClick={() => navigate(`/chat/${car.owner_id}`)}
                    >
                      💬 Message
                    </button>
                  )}
                </div>
              </div>

              {/* Reviews */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  Reviews {reviews.length > 0 && `(${reviews.length})`}
                </h2>
                {reviews.length === 0 ? (
                  <p className={styles.noReviews}>
                    No reviews yet — be the first to rent this car!
                  </p>
                ) : (
                  <div className={styles.reviewList}>
                    {reviews.map((r) => (
                      <div key={r.id} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <div className={styles.reviewAvatar}>
                            {r.profiles?.avatar_url
                              ? <img src={r.profiles.avatar_url} alt="" className={styles.reviewAvatarImg} />
                              : <div className={styles.reviewInitials}>
                                  {r.profiles?.name?.[0]?.toUpperCase() || '?'}
                                </div>
                            }
                          </div>
                          <div>
                            <div className={styles.reviewName}>
                              {r.profiles?.name || 'Renter'}
                            </div>
                            <div className={styles.reviewStars}>
                              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                            </div>
                          </div>
                        </div>
                        {r.comment && (
                          <p className={styles.reviewComment}>{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* ── RIGHT — booking card ── */}
            <div className={styles.right}>
              <div className={styles.bookingCard}>
                <div className={styles.carName}>{car.name}</div>
                <div className={styles.carBrand}>{car.brand} · {car.year}</div>

                {avgRating && (
                  <div className={styles.ratingRow}>
                    <span className={styles.stars}>
                      {'★'.repeat(Math.round(avgRating))}
                    </span>
                    <span className={styles.ratingNum}>{avgRating}</span>
                    <span className={styles.reviewCount}>
                      ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}

                <div className={styles.divider} />

                <div className={styles.priceRow}>
                  <span className={styles.price}>
                    ₦{Number(car.price).toLocaleString()}
                  </span>
                  <span className={styles.perDay}>/ day</span>
                </div>

                <div className={styles.features}>
                  <div className={styles.feature}>📍 {car.city}</div>
                  <div className={styles.feature}>🚘 {car.type}</div>
                  <div className={styles.feature}>📅 {car.year}</div>
                  <div className={styles.feature}>
                    {car.available ? '✅ Available' : '❌ Unavailable'}
                  </div>
                </div>

                <button
                  className={styles.bookBtn}
                  onClick={handleBook}
                  disabled={!car.available}
                >
                  {car.available ? 'Book this car →' : 'Currently unavailable'}
                </button>

                {user && user.id !== car.owner_id && (
                  <button
                    className={styles.msgOwnerBtn}
                    onClick={() => navigate(`/chat/${car.owner_id}`)}
                  >
                    💬 Message owner
                  </button>
                )}

                <p className={styles.note}>
                  🔒 Secure payment via Paystack
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {bookingOpen && (
        <BookingModal
          car={car}
          onClose={() => setBookingOpen(false)}
          onSuccess={() => {
            setBookingOpen(false);
            loadCar();
          }}
        />
      )}
    </>
  );
}