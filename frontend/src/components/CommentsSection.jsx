import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { databases, APPWRITE_DATABASE_ID, COLLECTIONS, Query, ID } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';

const CommentsSection = ({ postId }) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.COMMENTS,
        [Query.equal('postId', postId), Query.orderAsc('$createdAt'), Query.limit(50)]
      );

      const enriched = await Promise.all(
        res.documents.map(async (c) => {
          try {
            const prof = await databases.getDocument(
              APPWRITE_DATABASE_ID,
              COLLECTIONS.PROFILES,
              c.userId
            );
            return { ...c, username: prof.username, avatarUrl: prof.avatarUrl || null };
          } catch {
            return { ...c, username: 'unknown', avatarUrl: null };
          }
        })
      );

      setComments(enriched);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);

    try {
      const newComment = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.COMMENTS,
        ID.unique(),
        { userId: user.$id, postId, text: text.trim() }
      );

      setComments((prev) => [
        ...prev,
        {
          ...newComment,
          username: profile.username,
          avatarUrl: profile.avatarUrl || null,
        },
      ]);
      setText('');
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.COMMENTS,
        commentId
      );
      setComments((prev) => prev.filter((c) => c.$id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Comments</span>
        <span style={styles.sectionCount}>{comments.length}</span>
      </div>

      {/* Comments list */}
      {loading ? (
        <div style={styles.loading}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div style={styles.empty}>No comments yet. Be the first!</div>
      ) : (
        <div style={styles.list}>
          {comments.map((c) => (
            <div key={c.$id} style={styles.comment}>
              <Link to={`/profile/${c.username}`} style={styles.avatarLink}>
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt="avatar" style={styles.avatar} />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    {c.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </Link>
              <div style={styles.commentBody}>
                <div style={styles.commentBubble}>
                  <Link
                    to={`/profile/${c.username}`}
                    style={styles.commentUsername}
                  >
                    @{c.username}
                  </Link>
                  <span style={styles.commentText}> {c.text}</span>
                </div>
                <div style={styles.commentMeta}>
                  <span style={styles.commentTime}>
                    {new Date(c.$createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {c.userId === user?.$id && (
                    <button
                      onClick={() => handleDelete(c.$id)}
                      style={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <form onSubmit={handleSubmit} style={styles.form}>
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt="you" style={styles.myAvatar} />
        ) : (
          <div style={styles.myAvatarPlaceholder}>
            {profile?.username?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <input
          style={styles.input}
          type="text"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <button
          type="submit"
          style={{
            ...styles.postBtn,
            opacity: posting || !text.trim() ? 0.4 : 1,
          }}
          disabled={posting || !text.trim()}
        >
          Post
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    borderTop: '1px solid var(--border-color)',
    padding: '12px 16px 16px',
    background: 'var(--bg-card)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  sectionCount: {
    fontSize: '12px',
    color: 'var(--accent-gold)',
    fontWeight: '600',
    background: 'rgba(212, 175, 55, 0.1)',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  loading: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    padding: '8px 0',
    textAlign: 'center',
  },
  empty: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    padding: '12px 0',
    textAlign: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  comment: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  avatarLink: {
    flexShrink: 0,
  },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--border-color)',
  },
  avatarPlaceholder: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  commentBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  commentBubble: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '8px 12px',
    fontSize: '13px',
    lineHeight: '1.4',
  },
  commentUsername: {
    fontWeight: '700',
    color: 'var(--accent-gold)',
    textDecoration: 'none',
    fontSize: '13px',
  },
  commentText: {
    color: 'var(--text-primary)',
  },
  commentMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingLeft: '4px',
  },
  commentTime: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    fontSize: '11px',
    cursor: 'pointer',
    padding: 0,
  },
  form: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '12px',
  },
  myAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--accent-gold)',
    flexShrink: 0,
  },
  myAvatarPlaceholder: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '8px 14px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  postBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-gold)',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '0 4px',
    flexShrink: 0,
  },
};

export default CommentsSection;