import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/db';
import { supabase } from '../lib/supabase';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();
  const channelRef = useRef(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;
    loadNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create new channel
   const channelName = `notifs_${user.id}_${Date.now()}`;

const channel = supabase
  .channel(channelName)
  .on('postgres_changes', {
    event:  'INSERT',
    schema: 'public',
    table:  'notifications',
    filter: `user_id=eq.${user.id}`,
  }, () => {
    loadNotifications();
  })
  .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const typeIcon = {
    booking:   '🚗',
    confirmed: '✅',
    declined:  '❌',
    info:      'ℹ️',
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60)    return 'Just now';
    if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!user) return null;

  return (
    <div className={styles.wrap} ref={dropdownRef}>
      <button
        className={styles.bell}
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className={styles.badge}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>Notifications</span>
            {unread > 0 && (
              <button className={styles.markAll} onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.item} ${!n.read ? styles.unread : ''}`}
                  onClick={() => handleMarkRead(n.id)}
                >
                  <div className={styles.itemIcon}>
                    {typeIcon[n.type] || 'ℹ️'}
                  </div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemTitle}>{n.title}</div>
                    <div className={styles.itemMsg}>{n.message}</div>
                    <div className={styles.itemTime}>{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.read && <div className={styles.dot} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}