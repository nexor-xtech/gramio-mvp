import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { databases, APPWRITE_DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [
          Query.or([
            Query.equal('senderId', user.$id),
            Query.equal('recieverId', user.$id),
          ]),
          Query.orderDesc('$createdAt'),
          Query.limit(100),
        ]
      );

      const convoMap = {};
      res.documents.forEach((msg) => {
        if (!convoMap[msg.conversationId]) {
          convoMap[msg.conversationId] = msg;
        }
      });

      const enriched = await Promise.all(
        Object.values(convoMap).map(async (msg) => {
          const otherUserId =
            msg.senderId === user.$id ? msg.recieverId : msg.senderId;
          try {
            const prof = await databases.getDocument(
              APPWRITE_DATABASE_ID,
              COLLECTIONS.PROFILES,
              otherUserId
            );
            return {
              conversationId: msg.conversationId,
              lastMessage: msg.text,
              lastSenderId: msg.senderId,
              timestamp: msg.$createdAt,
              username: prof.username,
              avatarUrl: prof.avatarUrl || null,
            };
          } catch {
            return null;
          }
        })
      );

      const valid = enriched
        .filter(Boolean)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setConversations(valid);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = (e) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    navigate(`/messages/${searchUsername.trim()}`);
    setSearchUsername('');
    setShowNewChat(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={styles.page}>
      <TopBar title="Messages" />

      <div style={styles.container}>

        {/* New chat button */}
        <button
          style={styles.newChatBtn}
          onClick={() => setShowNewChat(!showNewChat)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zM12 8v2H8v2h4v2l3-3z"
              fill="#000"
            />
          </svg>
          New Message
        </button>

        {/* New chat form */}
        {showNewChat && (
          <form onSubmit={handleStartChat} style={styles.newChatForm}>
            <div style={styles.newChatInput}>
              <span style={styles.toLabel}>To:</span>
              <input
                style={styles.newChatField}
                type="text"
                placeholder="Enter username..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" style={styles.goBtn}>
              Start Chat →
            </button>
          </form>
        )}

        {/* Conversations */}
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.loadingSpinner} />
          </div>
        ) : conversations.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <p style={styles.emptyTitle}>No messages yet</p>
            <p style={styles.emptyText}>
              Start a conversation by tapping "New Message"
            </p>
          </div>
        ) : (
          <div style={styles.list}>
            {conversations.map((convo) => (
              <Link
                key={convo.conversationId}
                to={`/messages/${convo.username}`}
                style={styles.convoRow}
              >
                {/* Avatar */}
                <div style={styles.avatarWrapper}>
                  {convo.avatarUrl ? (
                    <img
                      src={convo.avatarUrl}
                      alt="avatar"
                      style={styles.avatar}
                    />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {convo.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div style={styles.onlineDot} />
                </div>

                {/* Message info */}
                <div style={styles.convoInfo}>
                  <div style={styles.convoTop}>
                    <span style={styles.convoUsername}>
                      @{convo.username}
                    </span>
                    <span style={styles.convoTime}>
                      {formatTime(convo.timestamp)}
                    </span>
                  </div>
                  <span style={styles.convoPreview}>
                    {convo.lastSenderId === user.$id ? (
                      <span style={styles.youLabel}>You: </span>
                    ) : null}
                    {convo.lastMessage}
                  </span>
                </div>

                {/* Unread indicator (visual only) */}
                {convo.lastSenderId !== user.$id && (
                  <div style={styles.unreadDot} />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const styles = {
  page: {
    background: 'var(--bg-primary)',
    minHeight: '100vh',
  },
  container: {
    maxWidth: '614px',
    margin: '0 auto',
    paddingTop: '72px',
    paddingBottom: '80px',
    paddingLeft: '16px',
    paddingRight: '16px',
  },
  newChatBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--accent-gold)',
    color: '#000',
    border: 'none',
    borderRadius: '14px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '16px',
    width: '100%',
    justifyContent: 'center',
  },
  newChatForm: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  newChatInput: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '10px 14px',
  },
  toLabel: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--accent-gold)',
    flexShrink: 0,
  },
  newChatField: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  goBtn: {
    background: 'var(--accent-gold)',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
  },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    padding: '60px',
  },
  loadingSpinner: {
    width: '28px',
    height: '28px',
    border: '3px solid var(--border-color)',
    borderTop: '3px solid var(--accent-gold)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 20px',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: 0,
    textAlign: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  convoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    textDecoration: 'none',
    color: 'var(--text-primary)',
  },
  avatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--accent-gold)',
  },
  avatarPlaceholder: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'var(--bg-hover)',
    color: 'var(--accent-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '22px',
  },
  onlineDot: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#4caf50',
    border: '2px solid var(--bg-primary)',
  },
  convoInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  convoTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  convoUsername: {
    fontWeight: '700',
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  convoTime: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  convoPreview: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  youLabel: {
    color: 'var(--accent-gold)',
    fontWeight: '600',
  },
  unreadDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    flexShrink: 0,
  },
};

export default Messages;