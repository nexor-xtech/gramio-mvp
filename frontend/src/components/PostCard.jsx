import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, COLLECTIONS, Query, ID } from '../lib/appwrite';
import CommentsSection from './CommentsSection';

const PostCard = ({ post, onDelete }) => {
  const { user, profile } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeId, setLikeId] = useState(null);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  const isOwner = profile?.userId === post.userId;

  useEffect(() => {
    fetchLikeData();
    fetchCommentsCount();
  }, [post.$id]);

  const fetchLikeData = async () => {
    try {
      const allLikes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.LIKES,
        [Query.equal('postId', post.$id)]
      );
      setLikesCount(allLikes.total);
      if (user) {
        const myLike = allLikes.documents.find((l) => l.userId === user.$id);
        if (myLike) {
          setLiked(true);
          setLikeId(myLike.$id);
        }
      }
    } catch (err) {
      console.error('Error fetching likes:', err);
    }
  };

  const fetchCommentsCount = async () => {
    try {
      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.COMMENTS,
        [Query.equal('postId', post.$id)]
      );
      setCommentsCount(res.total);
    } catch (err) {
      console.error('Error fetching comments count:', err);
    }
  };

  const handleLike = async () => {
    if (!user || likeLoading) return;
    setLikeLoading(true);
    try {
      if (liked) {
        await databases.deleteDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.LIKES,
          likeId
        );
        setLiked(false);
        setLikeId(null);
        setLikesCount((c) => c - 1);
      } else {
        const newLike = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.LIKES,
          ID.unique(),
          { userId: user.$id, postId: post.$id }
        );
        setLiked(true);
        setLikeId(newLike.$id);
        setLikesCount((c) => c + 1);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.POSTS,
        post.$id
      );
      onDelete(post.$id);
    } catch (err) {
      console.error(err);
      alert('Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.username} on GramIO`,
          text: post.caption || '',
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied!');
    }
  };

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <Link to={`/profile/${post.username}`} style={styles.userInfo}>
          {post.avatarUrl ? (
            <img src={post.avatarUrl} alt="avatar" style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {post.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div style={styles.userMeta}>
            <span style={styles.username}>@{post.username}</span>
            <div style={styles.metaRow}>
              {post.location && (
                <span style={styles.metaText}>📍 {post.location}</span>
              )}
              {post.music && (
                <span style={styles.metaText}>🎵 {post.music}</span>
              )}
              {!post.location && !post.music && (
                <span style={styles.metaText}>
                  {new Date(post.$createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Options button */}
        <div style={styles.optionsWrapper}>
          <button
            style={styles.optionsBtn}
            onClick={() => setShowOptions(!showOptions)}
          >
            ···
          </button>
          {showOptions && (
            <div style={styles.optionsMenu}>
              {isOwner && (
                <button
                  style={{ ...styles.optionItem, color: 'var(--danger)' }}
                  onClick={() => { handleDelete(); setShowOptions(false); }}
                  disabled={deleting}
                >
                  🗑 Delete post
                </button>
              )}
              <button
                style={styles.optionItem}
                onClick={() => { handleShare(); setShowOptions(false); }}
              >
                🔗 Copy link
              </button>
              <button
                style={styles.optionItem}
                onClick={() => setShowOptions(false)}
              >
                🚩 Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div style={styles.mediaWrapper}>
          <img src={post.mediaUrl} alt="post" style={styles.media} />
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div style={styles.caption}>
          <span style={styles.captionUsername}>@{post.username}</span>{' '}
          <span style={styles.captionText}>{post.caption}</span>
        </div>
      )}

      {/* Action row */}
      <div style={styles.actions}>
        {/* Left actions */}
        <div style={styles.leftActions}>
          {/* Like */}
          <button onClick={handleLike} disabled={likeLoading} style={styles.actionBtn}>
            {liked ? (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="var(--accent-gold)"
                />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"
                  fill="var(--text-secondary)"
                />
              </svg>
            )}
            {likesCount > 0 && (
              <span style={{
                ...styles.actionCount,
                color: liked ? 'var(--accent-gold)' : 'var(--text-secondary)',
              }}>
                {likesCount}
              </span>
            )}
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments((s) => !s)}
            style={styles.actionBtn}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                d="M21 6.5C21 5.12 19.88 4 18.5 4h-13C4.12 4 3 5.12 3 6.5v8C3 15.88 4.12 17 5.5 17H17l4 4V6.5z"
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="1.5"
              />
            </svg>
            {commentsCount > 0 && (
              <span style={styles.actionCount}>{commentsCount}</span>
            )}
          </button>

          {/* Share */}
          <button onClick={handleShare} style={styles.actionBtn}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>

        {/* Right: Save */}
        <button
          onClick={() => setSaved((s) => !s)}
          style={styles.actionBtn}
        >
          {saved ? (
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"
                fill="var(--accent-gold)"
              />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Comments section */}
      {showComments && <CommentsSection postId={post.$id} />}
    </div>
  );
};

const styles = {
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    marginBottom: '16px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--accent-gold)',
    flexShrink: 0,
  },
  avatarPlaceholder: {
    width: '40px',
    height: '40px',
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
  userMeta: {
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
  metaRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  optionsWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  optionsBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    letterSpacing: '2px',
    lineHeight: 1,
  },
  optionsMenu: {
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
  optionItem: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '10px 12px',
    textAlign: 'left',
    borderRadius: '8px',
    width: '100%',
  },
  mediaWrapper: {
    width: '100%',
    background: '#000',
  },
  media: {
    width: '100%',
    maxHeight: '500px',
    objectFit: 'cover',
    display: 'block',
  },
  caption: {
    padding: '10px 16px 4px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    lineHeight: '1.5',
  },
  captionUsername: {
    fontWeight: '700',
    color: 'var(--accent-gold)',
  },
  captionText: {
    color: 'var(--text-primary)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px 12px',
  },
  leftActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 8px',
    borderRadius: '8px',
  },
  actionCount: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
};

export default PostCard;