import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { databases, APPWRITE_DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';

const Followers = () => {
  const { username } = useParams();
  const location = useLocation();
  const isFollowing = location.pathname.includes('/following');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchList();
  }, [username, isFollowing]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const profileRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.equal('username', username)]
      );

      if (profileRes.documents.length === 0) return;
      const prof = profileRes.documents[0];

      const followsRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.FOLLOWS,
        [
          isFollowing
            ? Query.equal('followerId', prof.userId)
            : Query.equal('followingId', prof.userId),
        ]
      );

      const userIds = followsRes.documents.map((f) =>
        isFollowing ? f.followingId : f.followerId
      );

      const profiles = await Promise.all(
        userIds.map(async (id) => {
          try {
            return await databases.getDocument(
              APPWRITE_DATABASE_ID,
              COLLECTIONS.PROFILES,
              id
            );
          } catch {
            return null;
          }
        })
      );

      setUsers(profiles.filter(Boolean));
    } catch (err) {
      console.error('Error fetching list:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <TopBar title={`@${username}`} />

      <div style={styles.container}>

        {/* Tabs */}
        <div style={styles.tabs}>
          <Link
            to={`/${username}/followers`}
            style={{
              ...styles.tab,
              color: !isFollowing ? 'var(--accent-gold)' : 'var(--text-secondary)',
              borderBottom: !isFollowing
                ? '2px solid var(--accent-gold)'
                : '2px solid transparent',
            }}
          >
            Followers
          </Link>
          <Link
            to={`/${username}/following`}
            style={{
              ...styles.tab,
              color: isFollowing ? 'var(--accent-gold)' : 'var(--text-secondary)',
              borderBottom: isFollowing
                ? '2px solid var(--accent-gold)'
                : '2px solid transparent',
            }}
          >
            Following
          </Link>
        </div>

        {/* Count */}
        {!loading && (
          <div style={styles.countRow}>
            <span style={styles.count}>{users.length}</span>
            <span style={styles.countLabel}>
              {isFollowing ? 'people following' : 'followers'}
            </span>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.loadingSpinner} />
          </div>
        ) : users.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              {isFollowing ? '🚶' : '👥'}
            </div>
            <p style={styles.emptyTitle}>
              {isFollowing ? 'Not following anyone yet' : 'No followers yet'}
            </p>
            <p style={styles.emptyText}>
              {isFollowing
                ? 'Follow people to see them here'
                : 'Share your profile to get followers'}
            </p>
          </div>
        ) : (
          <div style={styles.list}>
            {users.map((u) => (
              <Link
                key={u.$id}
                to={`/profile/${u.username}`}
                style={styles.userRow}
              >
                {/* Avatar */}
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt="avatar" style={styles.avatar} />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    {u.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}

                {/* Info */}
                <div style={styles.userInfo}>
                  <span style={styles.username}>@{u.username}</span>
                  {u.bio && (
                    <span style={styles.bio}>{u.bio}</span>
                  )}
                </div>

                {/* Arrow */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"
                    fill="var(--text-secondary)"
                  />
                </svg>
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
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '16px',
  },
  tab: {
    flex: 1,
    padding: '14px',
    textAlign: 'center',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'color 0.2s',
  },
  countRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    padding: '4px 0 16px',
  },
  count: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--accent-gold)',
  },
  countLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
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
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    textDecoration: 'none',
    color: 'var(--text-primary)',
    transition: 'background 0.15s',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--accent-gold)',
    flexShrink: 0,
  },
  avatarPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'var(--bg-hover)',
    color: 'var(--accent-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '20px',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    flex: 1,
    minWidth: 0,
  },
  username: {
    fontWeight: '700',
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  bio: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

export default Followers;