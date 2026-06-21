import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  databases,
  APPWRITE_DATABASE_ID,
  COLLECTIONS,
  Query,
} from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Fetch likes on user's posts
      const postsRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.POSTS,
        [Query.equal('userId', user.$id), Query.limit(20)]
      );

      const likeNotifs = [];
      const commentNotifs = [];

      await Promise.all(
        postsRes.documents.map(async (post) => {
          // Likes
          try {
            const likesRes = await databases.listDocuments(
              APPWRITE_DATABASE_ID,
              COLLECTIONS.LIKES,
              [Query.equal('postId', post.$id), Query.limit(10)]
            );
            for (const like of likesRes.documents) {
              if (like.userId === user.$id) continue;
              try {
                const prof = await databases.getDocument(
                  APPWRITE_DATABASE_ID,
                  COLLECTIONS.PROFILES,
                  like.userId
                );
                likeNotifs.push({
                  id: like.$id,
                  type: 'like',
                  username: prof.username,
                  avatarUrl: prof.avatarUrl || null,
                  postId: post.$id,
                  postThumb: post.mediaUrl || null,
                  timestamp: like.$createdAt,
                  text: 'liked your post',
                });
              } catch {}
            }
          } catch {}

          // Comments
          try {
            const commentsRes = await databases.listDocuments(
              APPWRITE_DATABASE_ID,
              COLLECTIONS.COMMENTS,
              [Query.equal('postId', post.$id), Query.limit(10)]
            );
            for (const comment of commentsRes.documents) {
              if (comment.userId === user.$id) continue;
              try {
                const prof = await databases.getDocument(
                  APPWRITE_DATABASE_ID,
                  COLLECTIONS.PROFILES,
                  comment.userId
                );
                commentNotifs.push({
                  id: comment.$id,
                  type: 'comment',
                  username: prof.username,
                  avatarUrl: prof.avatarUrl || null,
                  postId: post.$id,
                  postThumb: post.mediaUrl || null,
                  timestamp: comment.$createdAt,
                  text: `commented: "${comment.text.slice(0, 40)}${comment.text.length > 40 ? '...' : ''}"`,
                });
              } catch {}
            }
          } catch {}
        })
      );

      // Fetch new followers
      const followsRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.FOLLOWS,
        [Query.equal('followingId', user.$id), Query.limit(20)]
      );

      const followNotifs = [];
      for (const follow of followsRes.documents) {
        try {
          const prof = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            COLLECTIONS.PROFILES,
            follow.followerId
          );
          followNotifs.push({
            id: follow.$id,
            type: 'follow',
            username: prof.username,
            avatarUrl: prof.avatarUrl || null,
            timestamp: follow.$createdAt,
            text: 'started following you',
          });
        } catch {}
      }

      // Combine and sort by timestamp
      const all = [...likeNotifs, ...commentNotifs, ...followNotifs].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setNotifications(all);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getIcon = (type) => {
    if (type === 'like') return '❤️';
    if (type === 'comment') return '💬';
    if (type === 'follow') return '👤';
    return '🔔';
  };

  const filters = ['all', 'likes', 'comments', 'follows'];

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'likes') return n.type === 'like';
    if (activeFilter === 'comments') return n.type === 'comment';
    if (activeFilter === 'follows') return n.type === 'follow';
    return true;
  });

  return (
    <div style={styles.page}>
      <TopBar title="Notifications" />

      <div style={styles.container}>

        {/* Filter tabs */}
        <div style={styles.filters}>
          {filters.map((f) => (
            <button
              key={f}
              style={{
                ...styles.filterBtn,
                background:
                  activeFilter === f
                    ? 'var(--accent-gold)'
                    : 'var(--bg-card)',
                color: activeFilter === f ? '#000' : 'var(--text-secondary)',
                border:
                  activeFilter === f
                    ? '1px solid var(--accent-gold)'
                    : '1px solid var(--border-color)',
              }}
              onClick={() => setActiveFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Notifications */}
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.loadingSpinner} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔔</div>
            <p style={styles.emptyTitle}>No notifications yet</p>
            <p style={styles.emptyText}>
              When people like, comment, or follow you — it'll show up here
            </p>
          </div>
        ) : (
          <div style={styles.list}>
            {filtered.map((notif) => (
              <div key={notif.id} style={styles.notifRow}>
                {/* Avatar + type icon */}
                <div style={styles.avatarWrapper}>
                  {notif.avatarUrl ? (
                    <img
                      src={notif.avatarUrl}
                      alt="avatar"
                      style={styles.avatar}
                    />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {notif.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div style={styles.typeIcon}>{getIcon(notif.type)}</div>
                </div>

                {/* Text */}
                <div style={styles.notifInfo}>
                  <span style={styles.notifText}>
                    <Link
                      to={`/profile/${notif.username}`}
                      style={styles.notifUsername}
                    >
                      @{notif.username}
                    </Link>{' '}
                    <span style={styles.notifAction}>{notif.text}</span>
                  </span>
                  <span style={styles.notifTime}>
                    {formatTime(notif.timestamp)}
                  </span>
                </div>

                {/* Post thumbnail */}
                {notif.postThumb && (
                  <img
                    src={notif.postThumb}
                    alt="post"
                    style={styles.postThumb}
                  />
                )}

                {/* Follow button for follow notifs */}
                {notif.type === 'follow' && (
                  <Link
                    to={`/profile/${notif.username}`}
                    style={styles.viewBtn}
                  >
                    View
                  </Link>
                )}
              </div>
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
  filters: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    paddingBottom: '4px',
  },
  filterBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
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
    fontSize: '52px',
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
    lineHeight: '1.5',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  notifRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
  },
  avatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--border-color)',
  },
  avatarPlaceholder: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    background: 'var(--bg-hover)',
    color: 'var(--accent-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  typeIcon: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
  },
  notifInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  notifText: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    lineHeight: '1.4',
  },
  notifUsername: {
    fontWeight: '700',
    color: 'var(--accent-gold)',
    textDecoration: 'none',
  },
  notifAction: {
    color: 'var(--text-secondary)',
  },
  notifTime: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  postThumb: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    objectFit: 'cover',
    flexShrink: 0,
    border: '1px solid var(--border-color)',
  },
  viewBtn: {
    background: 'var(--bg-hover)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    textDecoration: 'none',
    flexShrink: 0,
  },
};

export default Notifications;