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

const StatCard = ({ icon, label, value, color }) => (
  <div style={styles.statCard}>
    <div style={{ ...styles.statIcon, background: color || 'rgba(212,175,55,0.1)' }}>
      {icon}
    </div>
    <div style={styles.statInfo}>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  </div>
);

const Pulse = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    totalLikes: 0,
    totalComments: 0,
    reels: 0,
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Posts count
      const postsRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.POSTS,
        [Query.equal('userId', user.$id), Query.orderDesc('$createdAt'), Query.limit(10)]
      );

      // Followers count
      const followersRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.FOLLOWS,
        [Query.equal('followingId', user.$id)]
      );

      // Following count
      const followingRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.FOLLOWS,
        [Query.equal('followerId', user.$id)]
      );

      // Reels count
      const reelsRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.REELS,
        [Query.equal('userId', user.$id)]
      );

      // Total likes on all posts
      let totalLikes = 0;
      let totalComments = 0;

      await Promise.all(
        postsRes.documents.map(async (post) => {
          try {
            const likesRes = await databases.listDocuments(
              APPWRITE_DATABASE_ID,
              COLLECTIONS.LIKES,
              [Query.equal('postId', post.$id)]
            );
            totalLikes += likesRes.total;

            const commentsRes = await databases.listDocuments(
              APPWRITE_DATABASE_ID,
              COLLECTIONS.COMMENTS,
              [Query.equal('postId', post.$id)]
            );
            totalComments += commentsRes.total;
          } catch {}
        })
      );

      setStats({
        posts: postsRes.total,
        followers: followersRes.total,
        following: followingRes.total,
        totalLikes,
        totalComments,
        reels: reelsRes.total,
      });

      setRecentPosts(postsRes.documents);
    } catch (err) {
      console.error('Error fetching pulse stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n?.toString() || '0';
  };

  const tabs = ['overview', 'content', 'audience'];

  return (
    <div style={styles.page}>
      <TopBar title="Pulse" />

      <div style={styles.container}>

        {/* Profile summary */}
        <div style={styles.profileSummary}>
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="avatar" style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div style={styles.profileInfo}>
            <span style={styles.profileUsername}>@{profile?.username}</span>
            <span style={styles.profileBio}>{profile?.bio || 'No bio yet'}</span>
          </div>
          <Link to="/settings" style={styles.editBtn}>✎ Edit</Link>
        </div>

        {/* Go Live button */}
        <button style={styles.goLiveBtn}>
          <span style={styles.liveDot} />
          Go Live
        </button>

        {/* Tabs */}
        <div style={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab}
              style={{
                ...styles.tab,
                color: activeTab === tab
                  ? 'var(--accent-gold)'
                  : 'var(--text-secondary)',
                borderBottom: activeTab === tab
                  ? '2px solid var(--accent-gold)'
                  : '2px solid transparent',
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.loadingSpinner} />
          </div>
        ) : (
          <>
            {/* Overview tab */}
            {activeTab === 'overview' && (
              <div style={styles.tabContent}>
                <div style={styles.heroStats}>
                  <div style={styles.heroStat}>
                    <span style={styles.heroValue}>{formatCount(stats.followers)}</span>
                    <span style={styles.heroLabel}>Followers</span>
                  </div>
                  <div style={styles.heroStatDivider} />
                  <div style={styles.heroStat}>
                    <span style={styles.heroValue}>{formatCount(stats.following)}</span>
                    <span style={styles.heroLabel}>Following</span>
                  </div>
                  <div style={styles.heroStatDivider} />
                  <div style={styles.heroStat}>
                    <span style={styles.heroValue}>{formatCount(stats.posts)}</span>
                    <span style={styles.heroLabel}>Posts</span>
                  </div>
                </div>

                <div style={styles.sectionTitle}>Engagement</div>
                <div style={styles.statsGrid}>
                  <StatCard
                    icon="❤️"
                    label="Total Likes"
                    value={formatCount(stats.totalLikes)}
                    color="rgba(237,73,86,0.1)"
                  />
                  <StatCard
                    icon="💬"
                    label="Comments"
                    value={formatCount(stats.totalComments)}
                    color="rgba(33,150,243,0.1)"
                  />
                  <StatCard
                    icon="🎬"
                    label="Reels"
                    value={formatCount(stats.reels)}
                    color="rgba(156,39,176,0.1)"
                  />
                  <StatCard
                    icon="📸"
                    label="Posts"
                    value={formatCount(stats.posts)}
                    color="rgba(212,175,55,0.1)"
                  />
                </div>

                {/* Engagement rate */}
                <div style={styles.engagementCard}>
                  <div style={styles.engagementHeader}>
                    <span style={styles.engagementTitle}>Engagement Rate</span>
                    <span style={styles.engagementBadge}>
                      {stats.followers > 0
                        ? (
                            ((stats.totalLikes + stats.totalComments) /
                              stats.followers) *
                            100
                          ).toFixed(1)
                        : '0'}
                      %
                    </span>
                  </div>
                  <div style={styles.engagementBar}>
                    <div
                      style={{
                        ...styles.engagementFill,
                        width: `${Math.min(
                          stats.followers > 0
                            ? ((stats.totalLikes + stats.totalComments) /
                                stats.followers) *
                                100
                            : 0,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span style={styles.engagementHint}>
                    Based on likes + comments vs followers
                  </span>
                </div>
              </div>
            )}

            {/* Content tab */}
            {activeTab === 'content' && (
              <div style={styles.tabContent}>
                <div style={styles.sectionTitle}>Recent Posts</div>
                {recentPosts.length === 0 ? (
                  <div style={styles.emptySection}>
                    <span style={styles.emptyIcon}>📸</span>
                    <span style={styles.emptyText}>No posts yet</span>
                  </div>
                ) : (
                  <div style={styles.contentList}>
                    {recentPosts.map((post) => (
                      <div key={post.$id} style={styles.contentRow}>
                        {post.mediaUrl ? (
                          <img
                            src={post.mediaUrl}
                            alt="post"
                            style={styles.contentThumb}
                          />
                        ) : (
                          <div style={styles.contentThumbText}>
                            <span style={styles.contentThumbIcon}>📝</span>
                          </div>
                        )}
                        <div style={styles.contentInfo}>
                          <span style={styles.contentCaption}>
                            {post.caption || 'No caption'}
                          </span>
                          <span style={styles.contentDate}>
                            {new Date(post.$createdAt).toLocaleDateString(
                              'en-US',
                              { month: 'short', day: 'numeric', year: 'numeric' }
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drafts section */}
                <div style={styles.sectionTitle}>Drafts</div>
                <div style={styles.draftsCard}>
                  <span style={styles.draftsIcon}>📋</span>
                  <div style={styles.draftsInfo}>
                    <span style={styles.draftsTitle}>No drafts saved</span>
                    <span style={styles.draftsHint}>
                      Save posts as drafts before publishing
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Audience tab */}
            {activeTab === 'audience' && (
              <div style={styles.tabContent}>
                <div style={styles.audienceHero}>
                  <span style={styles.audienceNumber}>
                    {formatCount(stats.followers)}
                  </span>
                  <span style={styles.audienceLabel}>Total Followers</span>
                  <span style={styles.audienceGrowth}>
                    📈 Growing
                  </span>
                </div>

                <div style={styles.sectionTitle}>Suggestions</div>
                <div style={styles.suggestionCard}>
                  <span style={styles.suggestionIcon}>💡</span>
                  <div style={styles.suggestionInfo}>
                    <span style={styles.suggestionTitle}>
                      Post more consistently
                    </span>
                    <span style={styles.suggestionText}>
                      Creators who post daily grow 3x faster
                    </span>
                  </div>
                </div>

                <div style={styles.suggestionCard}>
                  <span style={styles.suggestionIcon}>🎬</span>
                  <div style={styles.suggestionInfo}>
                    <span style={styles.suggestionTitle}>
                      Try creating a Reel
                    </span>
                    <span style={styles.suggestionText}>
                      Reels get 2x more reach than regular posts
                    </span>
                  </div>
                </div>

                <div style={styles.suggestionCard}>
                  <span style={styles.suggestionIcon}>💬</span>
                  <div style={styles.suggestionInfo}>
                    <span style={styles.suggestionTitle}>
                      Engage with your followers
                    </span>
                    <span style={styles.suggestionText}>
                      Reply to comments to boost engagement
                    </span>
                  </div>
                </div>

                <div style={styles.sectionTitle}>Following</div>
                <div style={styles.followingCard}>
                  <span style={styles.followingNumber}>
                    {formatCount(stats.following)}
                  </span>
                  <span style={styles.followingLabel}>people you follow</span>
                  <Link
                    to={`/${profile?.username}/following`}
                    style={styles.followingLink}
                  >
                    View all →
                  </Link>
                </div>
              </div>
            )}
          </>
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
  profileSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '12px',
  },
  avatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--accent-gold)',
    flexShrink: 0,
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
    flexShrink: 0,
  },
  profileInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  profileUsername: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  profileBio: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  editBtn: {
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
  goLiveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #ed4956, #ff6b6b)',
    color: '#fff',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '20px',
    letterSpacing: '0.5px',
  },
  liveDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#fff',
    animation: 'pulse 1s infinite',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '20px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  heroStats: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '20px',
  },
  heroStat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  heroValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--accent-gold)',
  },
  heroLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  heroStatDivider: {
    width: '1px',
    height: '40px',
    background: 'var(--border-color)',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginTop: '4px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    padding: '14px',
  },
  statIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  engagementCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  engagementHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  engagementTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  engagementBadge: {
    background: 'rgba(212,175,55,0.15)',
    color: 'var(--accent-gold)',
    fontSize: '14px',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '20px',
    border: '1px solid var(--accent-gold)',
  },
  engagementBar: {
    height: '6px',
    background: 'var(--border-color)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  engagementFill: {
    height: '100%',
    background: 'linear-gradient(to right, var(--accent-gold), #f4d160)',
    borderRadius: '3px',
    transition: 'width 1s ease',
  },
  engagementHint: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  contentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  contentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px',
  },
  contentThumb: {
    width: '52px',
    height: '52px',
    borderRadius: '10px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  contentThumbText: {
    width: '52px',
    height: '52px',
    borderRadius: '10px',
    background: 'var(--bg-hover)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contentThumbIcon: {
    fontSize: '24px',
  },
  contentInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  contentCaption: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  contentDate: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  draftsCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'var(--bg-card)',
    border: '1px dashed var(--border-color)',
    borderRadius: '14px',
    padding: '16px',
  },
  draftsIcon: {
    fontSize: '28px',
  },
  draftsInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  draftsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  draftsHint: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  audienceHero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '28px',
  },
  audienceNumber: {
    fontSize: '52px',
    fontWeight: '800',
    color: 'var(--accent-gold)',
    lineHeight: 1,
  },
  audienceLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  audienceGrowth: {
    fontSize: '13px',
    color: '#4caf50',
    fontWeight: '600',
    marginTop: '4px',
  },
  suggestionCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    padding: '14px',
  },
  suggestionIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  suggestionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  suggestionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  suggestionText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  followingCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    padding: '16px',
  },
  followingNumber: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--accent-gold)',
  },
  followingLabel: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    flex: 1,
  },
  followingLink: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--accent-gold)',
    textDecoration: 'none',
  },
  emptySection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '40px 20px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
  },
  emptyIcon: {
    fontSize: '36px',
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
};

export default Pulse;