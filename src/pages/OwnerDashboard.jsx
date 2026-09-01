import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOwnerCars, addCar, deleteCar, updateCar, getOwnerBookings, updateBookingStatus, getProfile, updateProfile } from '../lib/db';
import { uploadCarImage } from '../lib/storage';
import styles from './OwnerDashboard.module.css';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [listings, setListings]         = useState([]);
  const [bookings, setBookings]         = useState([]);
  const [showUpload, setShowUpload]     = useState(false);
  const [saving, setSaving]             = useState(false);
  const [loadingData, setLoadingData]   = useState(true);
  const [error, setError]               = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  const [form, setForm] = useState({
    name: '', brand: '', type: 'Sedan', year: '',
    price: '', city: '', description: '', image_url: '', requirements: ''
  });

  const [showPayout, setShowPayout]   = useState(false);
  const [payoutForm, setPayoutForm]   = useState({ bank_name: '', account_number: '', account_name: '' });
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutMsg, setPayoutMsg]     = useState('');

  useEffect(() => { if (user) { loadData(); loadPayout(); } }, [user]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [cars, bkgs] = await Promise.all([
        getOwnerCars(user.id),
        getOwnerBookings(user.id),
      ]);
      setListings(cars);
      setBookings(bkgs);
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setLoadingData(false);
    }
  };

  const loadPayout = async () => {
    try {
      const profile = await getProfile(user.id);
      setPayoutForm({
        bank_name:      profile.bank_name      || '',
        account_number: profile.account_number || '',
        account_name:   profile.account_name   || '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePayout = async (e) => {
    e.preventDefault();
    setPayoutSaving(true);
    setPayoutMsg('');
    try {
      await updateProfile(user.id, payoutForm);
      setPayoutMsg('Payout details saved.');
      setTimeout(() => setPayoutMsg(''), 3000);
    } catch (err) {
      setPayoutMsg('Failed to save payout details.');
    } finally {
      setPayoutSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.brand || !form.price || !form.city) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let image_url = '';
      if (imageFile) {
        setUploadProgress('Uploading image...');
        image_url = await uploadCarImage(imageFile, user.id);
        setUploadProgress('');
      }
      await addCar({
        ...form,
        image_url,
        owner_id: user.id,
        year:     Number(form.year),
        price:    Number(form.price),
      });
      setSuccessMsg('Car listed successfully!');
      setShowUpload(false);
      setForm({ name: '', brand: '', type: 'Sedan', year: '', price: '', city: '', description: '', image_url: '', requirements: '' });
      setImageFile(null);
      setImagePreview('');
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save listing.');
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  };

  const handleToggleAvailable = async (car) => {
    try {
      await updateCar(car.id, { available: !car.available });
      loadData();
    } catch (err) {
      setError('Failed to update car.');
    }
  };

  const handleDelete = async (carId) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await deleteCar(carId);
      loadData();
    } catch (err) {
      setError('Failed to delete listing.');
    }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      loadData();
    } catch (err) {
      setError('Failed to update booking.');
    }
  };

  const activeBookings = bookings.filter(
    (b) => ['pending', 'confirmed', 'dispatched', 'delivered'].includes(b.status)
  );

  const earnings = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price, 0);

  return (
   <main className={styles.main} style={{ animation: 'fadeInUp 0.35s ease' }}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Hello, <span>{user?.name}</span> 👋
          </h1>
          <p className={styles.greetingSub}>Manage your fleet & earnings</p>
        </div>
        <span className={styles.badge}>🔑 Car Owner</span>
      </div>

      {error     && <div className={styles.errorBanner}>{error}</div>}
      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Total earnings</div>
          <div className={styles.statValue} style={{ fontSize: '22px' }}>
            ₦{earnings.toLocaleString()}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Active listings</div>
          <div className={styles.statValue}>
            {listings.filter((l) => l.available).length}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Active bookings</div>
          <div className={styles.statValue}>{activeBookings.length}</div>
        </div>
      </div>

      {/* ── PAYOUT DETAILS ── */}
      <section className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.sectionTitle}>Payout details</h2>
          <button
            type="button"
            className={styles.addCard}
            style={{ padding: '6px 14px', minHeight: 'auto' }}
            onClick={() => setShowPayout(!showPayout)}
          >
            {showPayout ? 'Hide' : payoutForm.account_number ? 'Edit' : 'Add bank details'}
          </button>
        </div>

        {!showPayout && payoutForm.account_number && (
          <p className={styles.empty}>
            {payoutForm.bank_name} · {payoutForm.account_name} · {payoutForm.account_number}
          </p>
        )}
        {!showPayout && !payoutForm.account_number && (
          <p className={styles.empty}>
            Add your bank account so renters and support know where your earnings are paid.
          </p>
        )}

        {showPayout && (
          <form className={styles.uploadForm} onSubmit={handleSavePayout}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Bank name</label>
                <input
                  className={styles.input}
                  placeholder="e.g. GTBank"
                  value={payoutForm.bank_name}
                  onChange={(e) => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Account number</label>
                <input
                  className={styles.input}
                  placeholder="0123456789"
                  value={payoutForm.account_number}
                  onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Account name</label>
                <input
                  className={styles.input}
                  placeholder="As it appears on your bank account"
                  value={payoutForm.account_name}
                  onChange={(e) => setPayoutForm({ ...payoutForm, account_name: e.target.value })}
                />
              </div>
            </div>
            {payoutMsg && <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 12 }}>{payoutMsg}</p>}
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn} disabled={payoutSaving}>
                {payoutSaving ? 'Saving...' : 'Save payout details →'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── LISTINGS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your listings</h2>
        {loadingData ? (
          <p className={styles.empty}>Loading...</p>
        ) : (
          <div className={styles.listingsRow}>
            {listings.map((l) => (
              <div key={l.id} className={styles.listingCard}>
                {l.image_url
                  ? <img src={l.image_url} alt={l.name} className={styles.listingImg} />
                  : <span style={{ fontSize: 28 }}>🚗</span>
                }
                <div style={{ flex: 1 }}>
                  <div className={styles.listingName}>{l.name}</div>
                  <div className={styles.listingPrice}>
                    ₦{Number(l.price).toLocaleString()} / day · {l.city}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    className={l.available ? styles.activePill : styles.inactivePill}
                    onClick={() => handleToggleAvailable(l)}
                  >
                    {l.available ? '● Active' : '○ Hidden'}
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(l.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}

            <button
              className={styles.addCard}
              onClick={() => setShowUpload(!showUpload)}
            >
              <span style={{ fontSize: 28 }}>＋</span>
              <div className={styles.addLabel}>Add a car</div>
            </button>
          </div>
        )}

        {/* Upload Form */}
        {showUpload && (
          <form className={styles.uploadForm} onSubmit={handleSubmit}>
            <h3 className={styles.uploadTitle}>New listing</h3>

            {/* Image upload */}
            <div className={styles.field} style={{ marginBottom: 20 }}>
              <label className={styles.label}>Car photo</label>
              <div
                className={styles.photoUpload}
                onClick={() => document.getElementById('car-image-input').click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className={styles.photoPreview} />
                ) : (
                  <div className={styles.photoPlaceholder}>
                    <span style={{ fontSize: 32 }}>📷</span>
                    <span>Click to upload a photo</span>
                    <span className={styles.photoHint}>JPG, PNG up to 5MB</span>
                  </div>
                )}
              </div>
              <input
                id="car-image-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              {imagePreview && (
                <button
                  type="button"
                  className={styles.removePhoto}
                  onClick={() => { setImageFile(null); setImagePreview(''); }}
                >
                  ✕ Remove photo
                </button>
              )}
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Car name *</label>
                <input
                  className={styles.input}
                  placeholder="e.g. Toyota Camry"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Brand *</label>
                <input
                  className={styles.input}
                  placeholder="e.g. Toyota"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Type *</label>
                <select
                  className={styles.input}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option>Sedan</option>
                  <option>SUV</option>
                  <option>Luxury</option>
                  <option>Van</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Year</label>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="e.g. 2022"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Price per day (₦) *</label>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="e.g. 18000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>City *</label>
                <input
                  className={styles.input}
                  placeholder="Lagos, Abuja..."
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.label}>Description</label>
                <input
                  className={styles.input}
                  placeholder="Brief details about the car..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                <label className={styles.label}>Requirements to book (shown to renters, they must agree before paying)</label>
                <textarea
                  className={styles.input}
                  rows={3}
                  placeholder="e.g. Must be 25+, valid driver's license required, ₦20,000 refundable deposit on delivery..."
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                />
              </div>
            </div>

            {uploadProgress && (
              <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 12 }}>
                ⏳ {uploadProgress}
              </p>
            )}

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setShowUpload(false);
                  setImageFile(null);
                  setImagePreview('');
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Submit listing →'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── BOOKING REQUESTS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Booking requests</h2>
        {loadingData ? (
          <p className={styles.empty}>Loading...</p>
        ) : activeBookings.length === 0 ? (
          <p className={styles.empty}>No active bookings right now.</p>
        ) : (
          <div className={styles.bookingList}>
            {activeBookings.map((b) => (
              <div key={b.id} className={styles.bookingItem}>
                <div>
                  <div className={styles.bookingTitle}>
                    {b.profiles?.name || 'Renter'} → {b.cars?.name}
                  </div>
                  <div className={styles.bookingMeta}>
                    {b.start_date} – {b.end_date} · ₦{Number(b.total_price).toLocaleString()}
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: b.status === 'pending' ? 'var(--accent)' : 'var(--success)',
                    textTransform: 'capitalize',
                  }}>
                    ● {b.status}
                  </span>
                  {b.status === 'pending' && !b.requirements_agreed && (
                    <div style={{ fontSize: 11, color: '#f07070', marginTop: 2 }}>
                      ⚠ Renter has not confirmed the requirements
                    </div>
                  )}
                </div>
                <div className={styles.actionBtns}>
                  {b.status === 'pending' && (
                    <>
                      <button
                        className={styles.acceptBtn}
                        onClick={() => handleBookingStatus(b.id, 'confirmed')}
                      >
                        ✓ Accept
                      </button>
                      <button
                        className={styles.declineBtn}
                        onClick={() => handleBookingStatus(b.id, 'declined')}
                      >
                        ✕ Decline
                      </button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      className={styles.acceptBtn}
                      onClick={() => handleBookingStatus(b.id, 'dispatched')}
                    >
                      🚚 Mark dispatched
                    </button>
                  )}
                  {b.status === 'dispatched' && (
                    <button
                      className={styles.acceptBtn}
                      onClick={() => handleBookingStatus(b.id, 'delivered')}
                    >
                      📍 Mark delivered
                    </button>
                  )}
                  {b.status === 'delivered' && (
                    <button
                      className={styles.acceptBtn}
                      onClick={() => handleBookingStatus(b.id, 'completed')}
                    >
                      ✓ Mark trip complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── COMPLETED BOOKINGS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Completed bookings</h2>
        {bookings.filter((b) => b.status === 'completed').length === 0 ? (
          <p className={styles.empty}>No completed bookings yet.</p>
        ) : (
          <div className={styles.bookingList}>
            {bookings
              .filter((b) => b.status === 'completed')
              .map((b) => (
                <div key={b.id} className={styles.bookingItem}>
                  <div>
                    <div className={styles.bookingTitle}>
                      {b.profiles?.name || 'Renter'} → {b.cars?.name}
                    </div>
                    <div className={styles.bookingMeta}>
                      {b.start_date} – {b.end_date} · ₦{Number(b.total_price).toLocaleString()}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--success)',
                  }}>
                    ✓ Completed
                  </span>
                </div>
              ))
            }
          </div>
        )}
      </section>
    </main>
  );
}