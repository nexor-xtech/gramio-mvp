import { useState, useEffect, useRef, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, COLLECTIONS, Query, ID, storage, BUCKET_ID } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import PostCard from '../components/PostCard';
import StoriesBar from '../components/StoriesBar';

const Feed = () => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastId, setLastId] = useState(null);
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const observerRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const LIMIT = 10;

  const fetchPosts = useCallback(async (cursor = null) => {
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(LIMIT),
      ];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.POSTS,
        queries
      );

      const enriched = await Promise.all(
        res.documents.map(async (post) => {
          try {
            const prof = await databases.getDocument(
              APPWRITE_DATABASE_ID,
              COLLECTIONS.PROFILES,
              post.userId
            );
            return {
              ...post,
              username: prof.username,
              avatarUrl: prof.avatarUrl || null,
            };
          } catch {
            return { ...post, username: 'unknown', avatarUrl: null };
          }
        })
      );

      if (cursor) {
        setPosts((prev) => [...prev, ...enriched]);
      } else {
        setPosts(enriched);
      }

      if (res.documents.length < LIMIT) {
        setHasMore(false);
      } else {
        setLastId(res.documents[res.documents.length - 1].$id);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchPosts();
      setLoading(false);
    };
    init();
  }, [fetchPosts]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        await fetchPosts(lastId);
        setLoadingMore(false);
      }
    });

    if (bottomRef.current) observerRef.current.observe(bottomRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, lastId, loadingMore, fetchPosts]);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!caption && !mediaFile) return;
    setPosting(true);

    try {
      let mediaUrl = null;
      if (mediaFile) {
        const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), mediaFile);
        mediaUrl = storage.getFileView(BUCKET_ID, uploaded.$id).toString();
      }

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.POSTS,
        ID.unique(),
        { userId: user.$id, caption, mediaUrl }
      );

      setCaption('');
      setMediaFile(null);
      setMediaPreview(null);
      setShowCreatePost(false);
      setHasMore(true);
      setLastId(null);
      setLoading(true);
      await fetchPosts();
      setLoading(false);
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p.$id !== deletedId));
  };

  return (
    <div style={styles.page}>
      <TopBar />

      <div style={styles.container}>
        {/* Stories */}
        <StoriesBar />

        {/* Create Post trigger */}
        <div style={styles.createTrigger} onClick={() => setShowCreatePost(true)}>
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="you" style={styles.triggerAvatar} />
          ) : (
            <div style={styles.triggerAvatarPlaceholder}>
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <span style={styles.triggerText}>What's on your mind, {profile?.username}?</span>
          <button style={styles.triggerBtn}>📷</button>
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <div style={styles.modalOverlay} onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreatePost(false);
          }}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <span style={styles.modalTitle}>Create Post</span>
                <button
                  style={styles.modalClose}
                  onClick={() => setShowCreatePost(false)}
                >✕</button>
              </div>

              <div style={styles.modalUser}>
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="you" style={styles.modalAvatar} />
                ) : (
                  <div style={styles.modalAvatarPlaceholder}>
                    {profile?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span style={styles.modalUsername}>@{profile?.username}</span>
              </div>

              <form onSubmit={handleCreatePost}>
                <textarea
                  style={styles.textarea}
                  placeholder="Share something with the world..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  autoFocus
                />

                {mediaPreview && (
                  <div style={styles.previewWrapper}>
                    <img src={mediaPreview} alt="preview" style={styles.preview} />
                    <button
                      type="button"
                      style={styles.removeMedia}
                      onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                    >✕</button>
                  </div>
                )}

                <div style={styles.modalActions}>
                  <div style={styles.mediaOptions}>
                    <button
                      type="button"
                      style={styles.mediaBtn}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📷 Photo
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleMediaChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      ...styles.shareBtn,
                      opacity: posting || (!caption && !mediaFile) ? 0.5 : 1,
                    }}
                    disabled={posting || (!caption && !mediaFile)}
                  >
                    {posting ? 'Posting...' : 'Share'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.loadingSpinner} />
            <span>Loading your flow...</span>
          </div>
        ) : posts.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🌊</div>
            <p style={styles.emptyTitle}>Your flow is empty</p>
            <p style={styles.emptyText}>Follow people or create your first post!</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.$id} post={post} onDelete={handleDelete} />
            ))}
            <div ref={bottomRef} style={{ height: '1px' }} />
            {loadingMore && (
              <div style={styles.loadingMore}>Loading more...</div>
            )}
            {!hasMore && posts.length > 0 && (
              <div style={styles.endText}>
                <div style={styles.endLine} />
                <span>You're all caught up ✦</span>
                <div style={styles.endLine} />
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
    paddingLeft: '12px',
    paddingRight: '12px',
  },
  createTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '12px 16px',
    marginBottom: '16px',
    cursor: 'pointer',
  },
  triggerAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--accent-gold)',
    flexShrink: 0,
  },
  triggerAvatarPlaceholder: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    flexShrink: 0,
  },
  triggerText: {
    flex: 1,
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  triggerBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '0',
  },
  modal: {
    background: 'var(--bg-secondary)',
    borderRadius: '24px 24px 0 0',
    width: '100%',
    maxWidth: '614px',
    padding: '20px 20px 40px',
    border: '1px solid var(--border-color)',
    borderBottom: 'none',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  modalClose: {
    background: 'var(--bg-hover)',
    border: 'none',
    color: 'var(--text-primary)',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  modalAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--accent-gold)',
  },
  modalAvatarPlaceholder: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  modalUsername: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--accent-gold)',
  },
  textarea: {
    width: '100%',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '15px',
    color: 'var(--text-primary)',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    boxSizing: 'border-box',
  },
  previewWrapper: {
    position: 'relative',
    marginTop: '12px',
  },
  preview: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'cover',
    borderRadius: '12px',
  },
  removeMedia: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(0,0,0,0.7)',
    border: 'none',
    color: '#fff',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '16px',
  },
  mediaOptions: {
    display: 'flex',
    gap: '8px',
  },
  mediaBtn: {
    background: 'var(--bg-hover)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontWeight: '500',
  },
  shareBtn: {
    background: 'var(--accent-gold)',
    border: 'none',
    borderRadius: '20px',
    padding: '10px 28px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#000',
    cursor: 'pointer',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '60px 20px',
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  loadingSpinner: {
    width: '32px',
    height: '32px',
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
  loadingMore: {
    textAlign: 'center',
    padding: '20px',
    color: 'var(--text-secondary)',
    fontSize: '13px',
  },
  endText: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 0 8px',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    letterSpacing: '0.05em',
  },
  endLine: {
    flex: 1,
    height: '1px',
    background: 'var(--border-color)',
  },
};

export default Feed;