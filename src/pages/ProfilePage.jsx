import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../lib/db';
import { uploadCarImage } from '../lib/storage';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '', bio: ''
  });
  const [avatar, setAvatar]         = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getProfile(user.id);
      setForm({
        name:  data.name  || '',
        email: data.email || user.email || '',
        phone: data.phone || '',
        city:  data.city  || '',
        bio:   data.bio   || '',
      });
      setAvatar(data.avatar_url || '');
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Image must be less than 3MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      let avatar_url = avatar;

      if (avatarFile) {
        avatar_url = await uploadCarImage(avatarFile, user.id);
      }

      await updateProfile(user.id, {
        name:       form.name,
        phone:      form.phone,
        city:       form.city,
        bio:        form.bio,
        avatar_url,
      });

      setSuccess('Profile updated successfully!');
      setAvatarFile(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = form.name
    ? form.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (loading) {
    return (
     <main className={styles.main} style={{ animation: 'fadeInUp 0.35s ease' }}>
        <div className={styles.loading}>Loading profile...</div>
      </main>
    );
  }

  return (
    <main className={styles.main} style={{ animation: 'fadeInUp 0.35s ease' }}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>My Profile</h1>
          <span className={styles.badge}>
            {user?.role === 'owner' ? '🔑 Car Owner' : '🚗 Renter'}
          </span>
        </div>

        {error   && <div className={styles.errorBanner}>{error}</div>}
        {success && <div className={styles.successBanner}>{success}</div>}

        <div className={styles.body}>

          {/* Avatar section */}
          <div className={styles.avatarSection}>
            <div
              className={styles.avatarWrap}
              onClick={() => document.getElementById('avatar-input').click()}
            >
              {avatarPreview || avatar ? (
                <img
                  src={avatarPreview || avatar}
                  alt="Avatar"
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarInitials}>{initials}</div>
              )}
              <div className={styles.avatarOverlay}>📷</div>
            </div>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <div className={styles.avatarName}>{form.name || 'Your Name'}</div>
            <div className={styles.avatarEmail}>{form.email}</div>
            {avatarPreview && (
              <button
                className={styles.removeAvatar}
                onClick={() => { setAvatarFile(null); setAvatarPreview(''); }}
              >
                ✕ Remove
              </button>
            )}
          </div>

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.sectionTitle}>Personal information</h2>

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
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  value={form.email}
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Phone number</label>
                <input
                  className={styles.input}
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>City</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Lagos, Abuja..."
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Bio</label>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Tell others a bit about yourself..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
              />
            </div>

            <div className={styles.formFooter}>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save changes →'}
              </button>
            </div>
          </form>
        </div>

        {/* Account info */}
        <div className={styles.accountInfo}>
          <h2 className={styles.sectionTitle}>Account</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Account type</div>
              <div className={styles.infoValue}>
                {user?.role === 'owner' ? 'Car Owner' : 'Renter'}
              </div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Member since</div>
              <div className={styles.infoValue}>
                {new Date().toLocaleDateString('en-NG', {
                  month: 'long', year: 'numeric'
                })}
              </div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Email status</div>
              <div className={styles.infoValue} style={{ color: 'var(--success)' }}>
                ✓ Verified
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}