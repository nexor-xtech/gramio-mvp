import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { databases, APPWRITE_DATABASE_ID, COLLECTIONS, Query, ID } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import PostCard from '../components/PostCard';

const Profile = () => {
  const { username } = useParams();
  const { user, profile: myProfile } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = myProfile?.username === username;

  useEffect(() => {
    fetchProfileData();
  }, [username]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.equal('username', username)]
      );

      if (res.documents.length === 0) {
        navigate('/flow');
        return;
      }

      const prof = res.documents[0];
      setProfile(prof);

      const postsRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.POSTS,
        [Query.equal('userId', prof.userId), Query.orderDesc('$createdAt')]
      );

      const enrichedPosts = postsRes.documents.map((post) => ({
        ...post,
        username: prof.username,
        avatarUrl: prof.avatarUrl || null,
      }));
      setPosts(enrichedPosts);

      const followersRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.FOLLOWS,
        [Query.equal('followingId', prof.userId)]
      );
      setFollowersCount(followersRes.total);

      const followingRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.FOLLOWS,
        [Query.equal('followerId', prof.userId)]
      );
      setFollowingCount(followingRes.total);

      if (user && !isOwner) {
        const followCheck = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.FOLLOWS,
          [
            Query.equal('followerId', user.$id),
            Query.equal('followingId', prof.userId),
          ]
        );
        setIsFollowing(followCheck.total > 0);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.FOLLOWS,
          [
            Query.equal('followerId', user.$id),
            Query.equal('followingId', profile.userId),
          ]
        );
        if (res.documents.length > 0) {
          await databases.deleteDocument(
            APPWRITE_DATABASE_ID,
            COLLECTIONS.FOLLOWS,
            res.documents[0].$id
          );
        }
        setIsFollowing(false);
        setFollowersCount((c) => c - 1);
      } else {
        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.FOLLOWS,
          ID.unique(),
          {
            followerId: user.$id,
            followingId: profile.userId,
          }
        );
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDeletePost = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p.$id !== deletedId));
  };

  const formatCount = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n;
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <TopBar />
        <div style={styles.loadingState}>
          <div style={styles.loadingSpinner} />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div style={styles.page}>
      <TopBar title={`@${profile.username}`} />

      <div style={styles.container}>

        {/* Profile Header */}
        <div style={styles.profileHeader} className="profile-header">

          {/* Avatar */}
          <div style={styles.avatarWrapper}>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="avatar" style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            {isOwner && (
              <button
                style={styles.editAvatarBtn}
                onClick={() => navigate('/settings')}
              >
                ✎
              </button>
            )}
          </div>

          {/* Info */}
          <div style={styles.profileInfo}>
            {/* Username + menu */}
            <div style={styles.topRow} className="profile-top-row">
              <div>
                <h2 style={styles.username}>@{profile.username}</h2>
                {profile.bio && (
                  <p style={styles.bio}>{profile.bio}</p>
                )}
              </div>
              <div style={styles.menuWrapper}>
                <button
                  style={styles.menuBtn}
                  onClick={() => setShowMenu(!showMenu)}
                >
                  ☰
                </button>
                {showMenu && (
                  <div style={styles.menuDropdown}>
                    {isOwner ? (
                      <>
                        <Link to="/settings" style={styles.menuItem}>
                          ✎ Edit Profile
                        </Link>
                        <button style={styles.menuItem}>
                          📊 Analytics
                        </button>
                      </>
                    ) : (
                      <>
                        <button style={styles.menuItem}>🚩 Report</button>
                        <button style={styles.menuItem}>🔇 Mute</button>
                        <button style={styles.menuItem}>🚫 Block</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={styles.stats} className="profile-stats">
              <div style={styles.stat}>
                <span style={styles.statNumber}>{formatCount(posts.length)}</span>
                <span style={styles.statLabel}>Posts</span>
              </div>
              <Link to={`/${username}/followers`} style={styles.statLink}>
                <span style={styles.statNumber}>{formatCount(followersCount)}</span>
                <span style={styles.statLabel}>Followers</span>
              </Link>
              <Link to={`/${username}/following`} style={styles.statLink}>
                <span style={styles.statNumber}>{formatCount(followingCount)}</span>
                <span style={styles.statLabel}>Following</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!isOwner && (
          <div style={styles.actionBtns}>
            <button
              onClick={handleFollow}
              disabled={followLoading}
              style={{
                ...styles.followBtn,
                background: isFollowing ? 'transparent' : 'var(--accent-gold)',
                color: isFollowing ? 'var(--accent-gold)' : '#000',
                border: isFollowing
                  ? '2px solid var(--accent-gold)'
                  : '2px solid var(--accent-gold)',
              }}
            >
              {followLoading ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
            </button>
            <Link
              to={`/messages/${profile.username}`}
              style={styles.messageBtn}
            >
              💬 Message
            </Link>
          </div>
        )}

        {isOwner && (
          <div style={styles.actionBtns}>
            <Link to="/settings" style={styles.editProfileBtn}>
              ✎ Edit Profile
            </Link>
            <Link to="/pulse" style={styles.pulseBtn}>
              📊 Pulse
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              color: activeTab === 'posts'
                ? 'var(--accent-gold)'
                : 'var(--text-secondary)',
              borderBottom: activeTab === 'posts'
                ? '2px solid var(--accent-gold)'
                : '2px solid transparent',
            }}
            onClick={() => setActiveTab('posts')}
          >
            ▦ Posts
          </button>
          <button
            style={{
              ...styles.tab,
              color: activeTab === 'saved'
                ? 'var(--accent-gold)'
                : 'var(--text-secondary)',
              borderBottom: activeTab === 'saved'
                ? '2px solid var(--accent-gold)'
                : '2px solid transparent',
            }}
            onClick={() => setActiveTab('saved')}
          >
            🔖 Saved
          </button>
        </div>

        {/* Posts */}
        {activeTab === 'posts' && (
          <>
            {posts.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📸</div>
                <p style={styles.emptyTitle}>No posts yet</p>
                {isOwner && (
                  <p style={styles.emptyText}>
                    Share your first moment with the world
                  </p>
                )}
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.$id}
                  post={post}
                  onDelete={handleDeletePost}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔖</div>
            <p style={styles.emptyTitle}>Saved posts</p>
            <p style={styles.emptyText}>Coming soon</p>
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
    maxWidth: '935px',
    margin: '0 auto',
    paddingTop: '72px',
    paddingBottom: '80px',
    paddingLeft: '16px',
    paddingRight: '16px',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '120px',
  },
  loadingSpinner: {
    width: '36px',
    height: '36px',
    border: '3px solid var(--border-color)',
    borderTop: '3px solid var(--accent-gold)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '24px',
    padding: '24px 0 20px',
  },
  avatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid var(--accent-gold)',
  },
  avatarPlaceholder: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    background: 'var(--bg-card)',
    color: 'var(--accent-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 'bold',
    border: '3px solid var(--accent-gold)',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    color: '#000',
    border: '2px solid var(--bg-primary)',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: 0,
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  username: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 4px',
  },
  bio: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: 0,
    lineHeight: '1.5',
  },
  menuWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  menuDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '8px',
    minWidth: '160px',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  menuItem: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '10px 12px',
    textAlign: 'left',
    borderRadius: '8px',
    textDecoration: 'none',
    display: 'block',
    width: '100%',
  },
  stats: {
    display: 'flex',
    gap: '20px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  statLink: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    textDecoration: 'none',
  },
  statNumber: {
    fontWeight: '700',
    fontSize: '18px',
    color: 'var(--text-primary)',
  },
  statLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  actionBtns: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  followBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    letterSpacing: '0.3px',
  },
  messageBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  editProfileBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  pulseBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    background: 'rgba(212,175,55,0.1)',
    color: 'var(--accent-gold)',
    border: '1px solid var(--accent-gold)',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '16px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'color 0.2s',
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
};

export default Profile;