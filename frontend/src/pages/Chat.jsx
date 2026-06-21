import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  databases,
  APPWRITE_DATABASE_ID,
  COLLECTIONS,
  Query,
  ID,
  client,
  getConversationId,
} from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

const Chat = () => {
  const { username } = useParams();
  const { user } = useAuth();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const conversationId = otherUser
    ? getConversationId(user.$id, otherUser.userId)
    : null;

  useEffect(() => {
    init();
  }, [username]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents`,
      (response) => {
        const payload = response.payload;
        if (
          payload.conversationId === conversationId &&
          response.events.some((e) => e.endsWith('.create'))
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m.$id === payload.$id)) return prev;
            return [...prev, payload];
          });
        }
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const init = async () => {
    setLoading(true);
    try {
      const profRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.search('username', username)]
      );

      const other = profRes.documents.find(
        (p) => p.username.toLowerCase() === username.toLowerCase()
      );

      if (!other) return;
      setOtherUser(other);

      const convId = getConversationId(user.$id, other.userId);

      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [
          Query.equal('conversationId', convId),
          Query.orderAsc('$createdAt'),
          Query.limit(100),
        ]
      );

      setMessages(res.documents);
    } catch (err) {
      console.error('Error loading chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !otherUser) return;
    setSending(true);

    const messageText = text.trim();
    setText('');
    inputRef.current?.focus();

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.MESSAGES,
        ID.unique(),
        {
          senderId: user.$id,
          recieverId: otherUser.userId,
          text: messageText,
          conversationId,
        }
      );
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
      setText(messageText);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div style={styles.loadingHeader}>
            <div style={styles.loadingAvatar} />
            <div style={styles.loadingName} />
          </div>
        </div>
        <div style={styles.loadingState}>
          <div style={styles.loadingSpinner} />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>User not found</span>
        </div>
        <div style={styles.loadingState}>
          <div style={styles.emptyIcon}>😕</div>
          <p style={styles.emptyTitle}>User not found</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Chat header */}
      <div style={styles.header}>
        <Link to="/messages" style={styles.backBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path
              d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
              fill="var(--text-primary)"
            />
          </svg>
        </Link>

        <Link
          to={`/profile/${otherUser.username}`}
          style={styles.headerUser}
        >
          {otherUser.avatarUrl ? (
            <img
              src={otherUser.avatarUrl}
              alt="avatar"
              style={styles.headerAvatar}
            />
          ) : (
            <div style={styles.headerAvatarPlaceholder}>
              {otherUser.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div style={styles.headerInfo}>
            <span style={styles.headerUsername}>
              @{otherUser.username}
            </span>
            <span style={styles.headerStatus}>● Active now</span>
          </div>
        </Link>

        <button style={styles.headerMenuBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
              fill="var(--text-secondary)"
            />
          </svg>
        </button>
      </div>

      {/* Messages area */}
      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <div style={styles.emptyChat}>
            {otherUser.avatarUrl ? (
              <img
                src={otherUser.avatarUrl}
                alt="avatar"
                style={styles.emptyChatAvatar}
              />
            ) : (
              <div style={styles.emptyChatAvatarPlaceholder}>
                {otherUser.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <p style={styles.emptyChatName}>@{otherUser.username}</p>
            <p style={styles.emptyChatText}>
              Say hi to start the conversation!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isMine = msg.senderId === user.$id;
              const prevMsg = messages[index - 1];
              const showTime =
                !prevMsg ||
                new Date(msg.$createdAt) - new Date(prevMsg.$createdAt) >
                  5 * 60 * 1000;

              return (
                <div key={msg.$id}>
                  {showTime && (
                    <div style={styles.timeLabel}>
                      {formatTime(msg.$createdAt)}
                    </div>
                  )}
                  <div
                    style={{
                      ...styles.messageRow,
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {!isMine && (
                      <div style={styles.msgAvatar}>
                        {otherUser.avatarUrl ? (
                          <img
                            src={otherUser.avatarUrl}
                            alt="avatar"
                            style={styles.msgAvatarImg}
                          />
                        ) : (
                          <div style={styles.msgAvatarPlaceholder}>
                            {otherUser.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        ...styles.bubble,
                        background: isMine
                          ? 'var(--accent-gold)'
                          : 'var(--bg-card)',
                        color: isMine ? '#000' : 'var(--text-primary)',
                        borderBottomRightRadius: isMine ? '4px' : '18px',
                        borderBottomLeftRadius: isMine ? '18px' : '4px',
                        border: isMine
                          ? 'none'
                          : '1px solid var(--border-color)',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} style={styles.inputArea}>
        <div style={styles.inputWrapper}>
          <input
            ref={inputRef}
            style={styles.input}
            type="text"
            placeholder="Message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
          />
        </div>
        <button
          type="submit"
          style={{
            ...styles.sendBtn,
            opacity: sending || !text.trim() ? 0.5 : 1,
          }}
          disabled={sending || !text.trim()}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path
              d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
              fill="#000"
            />
          </svg>
        </button>
      </form>
    </div>
  );
};

const styles = {
  page: {
    background: 'var(--bg-primary)',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    flexShrink: 0,
    paddingTop: 'max(12px, env(safe-area-inset-top))',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    padding: '4px',
    flexShrink: 0,
  },
  headerUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    flex: 1,
    minWidth: 0,
  },
  headerAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--accent-gold)',
    flexShrink: 0,
  },
  headerAvatarPlaceholder: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    flexShrink: 0,
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  headerUsername: {
    fontWeight: '700',
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  headerStatus: {
    fontSize: '11px',
    color: '#4caf50',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  headerMenuBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  loadingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
  },
  loadingAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'var(--bg-hover)',
  },
  loadingName: {
    width: '120px',
    height: '14px',
    borderRadius: '4px',
    background: 'var(--bg-hover)',
  },
  loadingState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  loadingSpinner: {
    width: '28px',
    height: '28px',
    border: '3px solid var(--border-color)',
    borderTop: '3px solid var(--accent-gold)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  emptyChat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '40px 20px',
    gap: '8px',
  },
  emptyChatAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid var(--accent-gold)',
    marginBottom: '8px',
  },
  emptyChatAvatarPlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  emptyChatName: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--accent-gold)',
    margin: 0,
  },
  emptyChatText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: 0,
    textAlign: 'center',
  },
  timeLabel: {
    textAlign: 'center',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    padding: '8px 0',
    letterSpacing: '0.05em',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    marginBottom: '4px',
  },
  msgAvatar: {
    flexShrink: 0,
  },
  msgAvatarImg: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  msgAvatarPlaceholder: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  bubble: {
    maxWidth: '72%',
    padding: '10px 14px',
    borderRadius: '18px',
    fontSize: '14px',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  },
  inputArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border-color)',
    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    flexShrink: 0,
  },
  inputWrapper: {
    flex: 1,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '24px',
    padding: '10px 16px',
  },
  input: {
    width: '100%',
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  sendBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emptyIcon: {
    fontSize: '48px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
};

export default Chat;