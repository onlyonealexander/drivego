import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { sendMessageNotificationEmail } from '../lib/email';
import styles from './ChatPage.module.css';

export default function ChatPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages]           = useState([]);
  const [otherUser, setOtherUser]         = useState(null);
  const [content, setContent]             = useState('');
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [conversations, setConversations] = useState([]);
  const bottomRef = useRef();

  // Load conversations list
  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  // Load messages + other user when userId changes
  useEffect(() => {
    if (userId && user) {
      loadMessages();
      loadOtherUser();
    }
  }, [userId, user]);

  // Realtime subscription — separate useEffect with proper cleanup
  useEffect(() => {
    if (!userId || !user) return;

    const channel = supabase
      .channel(`chat_${[user.id, userId].sort().join('_')}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new;
        const isRelevant =
          (msg.sender_id === user.id && msg.receiver_id === userId) ||
          (msg.sender_id === userId && msg.receiver_id === user.id);
        if (isRelevant) {
          setMessages((prev) => [...prev, msg]);
          loadConversations();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(id, name, avatar_url), receiver:profiles!messages_receiver_id_fkey(id, name, avatar_url)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      const seen = new Set();
      const unique = [];
      for (const msg of data || []) {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!seen.has(otherId)) {
          seen.add(otherId);
          unique.push({
            userId:      otherId,
            user:        msg.sender_id === user.id ? msg.receiver : msg.sender,
            lastMessage: msg.content,
            time:        msg.created_at,
            unread:      !msg.read && msg.receiver_id === user.id,
          });
        }
      }
      setConversations(unique);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOtherUser = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, role')
        .eq('id', userId)
        .single();
      setOtherUser(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', userId)
        .eq('receiver_id', user.id);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await supabase
        .from('messages')
        .insert([{
          sender_id:   user.id,
          receiver_id: userId,
          content:     content.trim(),
        }]);

      // Only email if no recent messages in last 30 mins
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('sender_id', user.id)
        .eq('receiver_id', userId)
        .gte('created_at', thirtyMinsAgo)
        .limit(2);

      const isFirstMessage = recentMessages?.length <= 1;

      if (isFirstMessage && otherUser?.email) {
        await sendMessageNotificationEmail({
          toName:   otherUser.name,
          toEmail:  otherUser.email,
          fromName: user.name,
          message:  content.trim(),
          chatLink: user.id,
        });
      }

      setContent('');
      loadConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const timeFormat = (date) => {
    return new Date(date).toLocaleTimeString('en-NG', {
      hour:   '2-digit',
      minute: '2-digit',
    });
  };

  const dateFormat = (date) => {
    const d         = new Date(date);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString())     return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = dateFormat(msg.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <main className={styles.main}>
      <div className={styles.container}>

        {/* ── Sidebar ── */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Messages</h2>
          </div>
          <div className={styles.convList}>
            {conversations.length === 0 ? (
              <div className={styles.noConvs}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.userId}
                  className={`${styles.convItem} ${conv.userId === userId ? styles.convActive : ''}`}
                  onClick={() => navigate(`/chat/${conv.userId}`)}
                >
                  <div className={styles.convAvatar}>
                    {conv.user?.avatar_url
                      ? <img src={conv.user.avatar_url} alt="" className={styles.convAvatarImg} />
                      : <div className={styles.convInitials}>
                          {conv.user?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                    }
                    {conv.unread && <div className={styles.unreadDot} />}
                  </div>
                  <div className={styles.convInfo}>
                    <div className={styles.convName}>{conv.user?.name || 'User'}</div>
                    <div className={styles.convLast}>
                      {conv.lastMessage?.length > 35
                        ? conv.lastMessage.slice(0, 35) + '...'
                        : conv.lastMessage}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Chat window ── */}
        {userId ? (
          <div className={styles.chatWindow}>

            {/* Chat header */}
            <div className={styles.chatHeader}>
              <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
              <div className={styles.chatHeaderAvatar}>
                {otherUser?.avatar_url
                  ? <img src={otherUser.avatar_url} alt="" className={styles.chatHeaderAvatarImg} />
                  : <div className={styles.chatHeaderInitials}>
                      {otherUser?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                }
              </div>
              <div>
                <div className={styles.chatHeaderName}>
                  {otherUser?.name || 'Loading...'}
                </div>
                <div className={styles.chatHeaderRole}>
                  {otherUser?.role === 'owner' ? '🔑 Car Owner' : '🚗 Renter'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messages}>
              {loading ? (
                <div className={styles.loadingMsg}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className={styles.emptyChat}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
                  <div className={styles.emptyChatTitle}>Start the conversation</div>
                  <p className={styles.emptyChatSub}>
                    Send a message to {otherUser?.name || 'this user'}
                  </p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className={styles.dateDivider}>
                      <span>{date}</span>
                    </div>
                    {msgs.map((msg) => {
                      const isMine = msg.sender_id === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`${styles.msgWrap} ${isMine ? styles.msgMine : styles.msgTheirs}`}
                        >
                          <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                            {msg.content}
                          </div>
                          <div className={styles.msgTime}>
                            {timeFormat(msg.created_at)}
                            {isMine && (
                              <span className={styles.readStatus}>
                                {msg.read ? ' ✓✓' : ' ✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form className={styles.inputRow} onSubmit={handleSend}>
              <input
                className={styles.msgInput}
                placeholder="Type a message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoComplete="off"
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={sending || !content.trim()}
              >
                {sending ? '...' : '➤'}
              </button>
            </form>

          </div>
        ) : (
          <div className={styles.noChatSelected}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <div className={styles.noChatTitle}>Your messages</div>
            <p className={styles.noChatSub}>
              Select a conversation or start a new one from a car listing.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}