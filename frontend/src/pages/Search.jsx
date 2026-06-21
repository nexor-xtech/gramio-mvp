import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { databases, APPWRITE_DATABASE_ID, COLLECTIONS, Query, ID } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';

const Search = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [followLoadingId, setFollowLoadingId] = useState(null);
  const [followDocs, setFollowDocs] = useState({});
  const [recentSearches, setRecentSearches] = useState([
    'mxcurrie.finest',
    'shards.conder',
    'house.of.labors',
    '_uzyl.official_',
  ]);

  useEffect(() => {
    if (user) fetchMyFollowing();
  }, [user]);

  const fetchMyFollowing = async () => {
    try {
      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.FOLLOWS,
        [Query.equal('followerId', user.$id), Query.limit(100)]
      );
      const ids = new Set();
      const docs = {};
      res.documents.forEach((f) => {
        ids.add(f.followingId);
        docs[f.followingId] = f.$id;
      });
      setFollowingIds(ids);
      setFollowDocs(docs);
    } catch (err) {
      console.error('Error fetching following:', err);
    }
  };

  const handleSearch = useCallback(async (text) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.search('username', text), Query.limit(20)]
      );
      setResults(res.documents.filter((p) => p.userId !== user?.$id));
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleFollow = async (targetUserId) => {
    if (!user || followLoadingId) return;
    setFollowLoadingId(targetUserId);
    try {
      const isFollowing = followingIds.has(targetUserId);
      if (isFollowing) {
        await databases.deleteDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.FOLLOWS,
          followDocs[targetUserId]
        );
        const newIds = new Set(followingIds);
        newIds.delete(targetUserId);
        setFollowingIds(newIds);
      } else {
        const newDoc = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.FOLLOWS,
          ID.unique(),
          { followerId: user.$id, followingId: targetUserId }
        );
        setFollowingIds(new Set([...followingIds, targetUserId]));
        setFollowDocs({ ...followDocs, [targetUserId]: newDoc.$id });
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowLoadingId(null);
    }
  };

  const removeRecentSearch = (username) => {
    setRecentSearches((prev) => prev.filter((u) => u !== username));
  };

  const clearAllRecent = () => setRecentSearches([]);

  return (
    <div style={styles.page}>
      <TopBar title="Search" />

      <div style={styles.container}>

        {/* Search bar */}
        <div style={styles.searchBar}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            style={styles.searchIcon}
          >
            <path
              d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              fill="var(--text-secondary)"
            />
          </svg>
          <input
            style={styles.input}
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query.length > 0 && (
            <button
              style={styles.clearBtn}
              onClick={() => setQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Recent searches (shown when no query) */}
        {!query && recentSearches.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>Recent</span>
              <button
                style={styles.clearAllBtn}
                onClick={clearAllRecent}
              >
                Clear all
              </button>
            </div>
            <div style={styles.list}>
              {recentSearches.map((username) => (
                <div key={username} style={styles.recentRow}>
                  <Link
                    to={`/profile/${username}`}
                    style={styles.recentUser}
                    onClick={() => setQuery(username)}
                  >
                    <div style={styles.recentAvatar}>
                      {username[0].toUpperCase()}
                    </div>
                    <div style={styles.recentInfo}>
                      <span style={styles.recentUsername}>@{username}</span>
                    </div>
                  </Link>
                  <button
                    style={styles.removeBtn}
                    onClick={() => removeRecentSearch(username)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={styles.loadingState}>
            <div style={styles.loadingSpinner} />
          </div>
        )}

        {/* No results */}
        {!loading && query && results.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <p style={styles.emptyTitle}>No users found</p>
            <p style={styles.emptyText}>Try a different username</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>Results</span>
              <span style={styles.resultCount}>{results.length} found</span>
            </div>
            <div style={styles.list}>
              {results.map((p) => {
                const isFollowing = followingIds.has(p.userId);
                return (
                  <div key={p.$id} style={styles.resultRow}>
                    <Link
                      to={`/profile/${p.username}`}
                      style={styles.userInfo}
                    >
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt="avatar"
                          style={styles.avatar}
                        />
                      ) : (
                        <div style={styles.avatarPlaceholder}>
                          {p.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div style={styles.userText}>
                        <span style={styles.username}>@{p.username}</span>
                        {p.bio && (
                          <span style={styles.bio}>{p.bio}</span>
                        )}
                        {followingIds.has(p.userId) && (
                          <span style={styles.mutualTag}>✓ Following</span>
                        )}
                      </div>
                    </Link>

                    <button
                      onClick={() => handleFollow(p.userId)}
                      disabled={followLoadingId === p.userId}
                      style={{
                        ...styles.followBtn,
                        background: isFollowing
                          ? 'transparent'
                          : 'var(--accent-gold)',
                        color: isFollowing ? 'var(--accent-gold)' : '#000',
                        border: '2px solid var(--accent-gold)',
                      }}
                    >
                      {followLoadingId === p.userId
                        ? '...'
                        : isFollowing
                        ? '✓'
                        : '+ Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggested (shown when no query and no recent) */}
        {!query && recentSearches.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <p style={styles.emptyTitle}>Find people on GramIO</p>
            <p style={styles.emptyText}>
              Search by username to discover creators
            </p>
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
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  searchIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    color: 'var(--text-primary)',
  },
  clearBtn: {
    background: 'var(--bg-hover)',
    border: 'none',
    color: 'var(--text-secondary)',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    fontSize: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  section: {
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  resultCount: {
    fontSize: '12px',
    color: 'var(--accent-gold)',
  },
  clearAllBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-gold)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  recentRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
  },
  recentUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    flex: 1,
  },
  recentAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'var(--bg-hover)',
    color: 'var(--accent-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    flexShrink: 0,
  },
  recentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  recentUsername: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  removeBtn: {
    background: 'var(--bg-hover)',
    border: 'none',
    color: 'var(--text-secondary)',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    fontSize: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resultRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    flex: 1,
    minWidth: 0,
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
  userText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
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
  mutualTag: {
    fontSize: '11px',
    color: 'var(--accent-gold)',
    fontWeight: '600',
  },
  followBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    flexShrink: 0,
    marginLeft: '12px',
    whiteSpace: 'nowrap',
  },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px',
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
};

export default Search;