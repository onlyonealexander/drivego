import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]           = useState('overview');
  const [users, setUsers]       = useState([]);
  const [cars, setCars]         = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState({
    totalUsers: 0, totalCars: 0, totalBookings: 0, totalRevenue: 0,
    renters: 0, owners: 0, pendingBookings: 0, completedBookings: 0,
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        { data: usersData },
        { data: carsData },
        { data: bookingsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('cars').select('*, profiles(name)').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, cars(name), profiles!bookings_renter_id_fkey(name, email)').order('created_at', { ascending: false }),
      ]);

      setUsers(usersData || []);
      setCars(carsData || []);
      setBookings(bookingsData || []);

      const revenue = (bookingsData || [])
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + b.total_price, 0);

      setStats({
        totalUsers:       (usersData || []).length,
        totalCars:        (carsData || []).length,
        totalBookings:    (bookingsData || []).length,
        totalRevenue:     revenue,
        renters:          (usersData || []).filter((u) => u.role === 'renter').length,
        owners:           (usersData || []).filter((u) => u.role === 'owner').length,
        pendingBookings:  (bookingsData || []).filter((b) => b.status === 'pending').length,
        completedBookings:(bookingsData || []).filter((b) => b.status === 'completed').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCar = async (carId) => {
    if (!window.confirm('Delete this car listing?')) return;
    try {
      await supabase.from('cars').delete().eq('id', carId);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'renter' ? 'owner' : 'renter';
    if (!window.confirm(`Change role to ${newRole}?`)) return;
    try {
      await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCarAvailability = async (carId, available) => {
    try {
      await supabase.from('cars').update({ available: !available }).eq('id', carId);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = {
    pending:    'var(--accent)',
    confirmed:  'var(--success)',
    declined:   '#f07070',
    dispatched: 'var(--success)',
    delivered:  'var(--success)',
    completed:  'var(--success)',
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60)    return 'Just now';
    if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (user?.role !== 'admin') return null;

  return (
   <main className={styles.main} style={{ animation: 'fadeInUp 0.35s ease' }}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Admin Dashboard</h1>
            <p className={styles.sub}>Manage users, cars and bookings</p>
          </div>
          <span className={styles.badge}>⚙️ Admin</span>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statValue}>{stats.totalUsers}</div>
            <div className={styles.statLabel}>Total users</div>
            <div className={styles.statSub}>{stats.renters} renters · {stats.owners} owners</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🚗</div>
            <div className={styles.statValue}>{stats.totalCars}</div>
            <div className={styles.statLabel}>Total cars</div>
            <div className={styles.statSub}>{cars.filter((c) => c.available).length} available</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statValue}>{stats.totalBookings}</div>
            <div className={styles.statLabel}>Total bookings</div>
            <div className={styles.statSub}>{stats.pendingBookings} pending · {stats.completedBookings} completed</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statValue}>₦{(stats.totalRevenue / 1000).toFixed(0)}k</div>
            <div className={styles.statLabel}>Total revenue</div>
            <div className={styles.statSub}>From completed trips</div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {['overview', 'users', 'cars', 'bookings'].map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'overview'  && '📊 Overview'}
              {t === 'users'     && '👥 Users'}
              {t === 'cars'      && '🚗 Cars'}
              {t === 'bookings'  && '📅 Bookings'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div className={styles.overviewGrid}>
                {/* Recent users */}
                <div className={styles.overviewCard}>
                  <h2 className={styles.cardTitle}>Recent users</h2>
                  <div className={styles.list}>
                    {users.slice(0, 5).map((u) => (
                      <div key={u.id} className={styles.listItem}>
                        <div className={styles.listAvatar}>
                          {u.avatar_url
                            ? <img src={u.avatar_url} alt="" className={styles.listAvatarImg} />
                            : <div className={styles.listInitials}>
                                {u.name?.[0]?.toUpperCase() || '?'}
                              </div>
                          }
                        </div>
                        <div className={styles.listInfo}>
                          <div className={styles.listName}>{u.name || 'Unknown'}</div>
                          <div className={styles.listSub}>{u.email}</div>
                        </div>
                        <span className={styles.rolePill} style={{
                          background: u.role === 'owner'
                            ? 'rgba(232,93,38,0.1)'
                            : 'rgba(45,204,135,0.1)',
                          color: u.role === 'owner' ? 'var(--accent)' : 'var(--success)',
                        }}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent bookings */}
                <div className={styles.overviewCard}>
                  <h2 className={styles.cardTitle}>Recent bookings</h2>
                  <div className={styles.list}>
                    {bookings.slice(0, 5).map((b) => (
                      <div key={b.id} className={styles.listItem}>
                        <div className={styles.listInfo}>
                          <div className={styles.listName}>
                            {b.profiles?.name} → {b.cars?.name}
                          </div>
                          <div className={styles.listSub}>
                            {b.start_date} · ₦{Number(b.total_price).toLocaleString()}
                          </div>
                        </div>
                        <span className={styles.statusPill} style={{
                          color: statusColor[b.status],
                          background: `${statusColor[b.status]}18`,
                        }}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {tab === 'users' && (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>City</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className={styles.tableUser}>
                            <div className={styles.tableAvatar}>
                              {u.avatar_url
                                ? <img src={u.avatar_url} alt="" className={styles.tableAvatarImg} />
                                : <div className={styles.tableInitials}>
                                    {u.name?.[0]?.toUpperCase() || '?'}
                                  </div>
                              }
                            </div>
                            {u.name || 'Unknown'}
                          </div>
                        </td>
                        <td className={styles.tdMuted}>{u.email}</td>
                        <td>
                          <span className={styles.rolePill} style={{
                            background: u.role === 'owner'
                              ? 'rgba(232,93,38,0.1)'
                              : u.role === 'admin'
                              ? 'rgba(100,100,255,0.1)'
                              : 'rgba(45,204,135,0.1)',
                            color: u.role === 'owner'
                              ? 'var(--accent)'
                              : u.role === 'admin'
                              ? '#8888ff'
                              : 'var(--success)',
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td className={styles.tdMuted}>{u.city || '—'}</td>
                        <td className={styles.tdMuted}>{timeAgo(u.created_at)}</td>
                        <td>
                          {u.role !== 'admin' && (
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleToggleUserRole(u.id, u.role)}
                            >
                              Toggle role
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── CARS ── */}
            {tab === 'cars' && (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Car</th>
                      <th>Owner</th>
                      <th>Type</th>
                      <th>City</th>
                      <th>Price/day</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cars.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className={styles.tableUser}>
                            {c.image_url
                              ? <img src={c.image_url} alt="" className={styles.tableCarImg} />
                              : <div className={styles.tableInitials}>🚗</div>
                            }
                            {c.name}
                          </div>
                        </td>
                        <td className={styles.tdMuted}>{c.profiles?.name || '—'}</td>
                        <td className={styles.tdMuted}>{c.type}</td>
                        <td className={styles.tdMuted}>{c.city}</td>
                        <td className={styles.tdMuted}>₦{Number(c.price).toLocaleString()}</td>
                        <td>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: c.available ? 'var(--success)' : 'var(--text-muted)',
                          }}>
                            {c.available ? '● Active' : '○ Hidden'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className={styles.actionBtn}
                              onClick={() => handleToggleCarAvailability(c.id, c.available)}
                            >
                              {c.available ? 'Hide' : 'Show'}
                            </button>
                            <button
                              className={`${styles.actionBtn} ${styles.dangerBtn}`}
                              onClick={() => handleDeleteCar(c.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── BOOKINGS ── */}
            {tab === 'bookings' && (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Renter</th>
                      <th>Car</th>
                      <th>Dates</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <div className={styles.listInfo}>
                            <div className={styles.listName}>
                              {b.profiles?.name || 'Unknown'}
                            </div>
                            <div className={styles.listSub}>
                              {b.profiles?.email}
                            </div>
                          </div>
                        </td>
                        <td className={styles.tdMuted}>{b.cars?.name || '—'}</td>
                        <td className={styles.tdMuted}>
                          {b.start_date} → {b.end_date}
                        </td>
                        <td className={styles.tdMuted}>
                          ₦{Number(b.total_price).toLocaleString()}
                        </td>
                        <td>
                          <span className={styles.statusPill} style={{
                            color: statusColor[b.status],
                            background: `${statusColor[b.status]}18`,
                          }}>
                            {b.status}
                          </span>
                        </td>
                        <td className={styles.tdMuted}>{timeAgo(b.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}