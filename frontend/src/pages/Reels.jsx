import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  databases,
  APPWRITE_DATABASE_ID,
  COLLECTIONS,
  Query,
  ID,
  storage,
  BUCKET_ID,
} from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

const ReelItem = ({ reel, isActive, onDelete }) => {
  const { user, profile } = useAuth();
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeId, setLikeId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showSongInfo, setShowSongInfo] = useState(false);
  const [following, setFollowing] = useState(false);
  const isOwner = user?.$id === reel.userId;

  useEffect(() => {
    fetchLikes();
    fetchFollowStatus();
  }, [reel.$id]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  const fetchLikes = async () => {
    try {
      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.LIKES,
        [Query.equal('postId', reel.$id)]
      );
      setLikesCount(res.total);
      if (user) {
        const mine = res.documents.find((l) => l.userId === user.$id);
        if (mine) { setLiked(true); setLikeId(mine.$id); }
      }
    } catch {}
  };

  const fetchFollowStatus = async () => {
    if (!user || isOwner) return;
    try {
      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.FOLLOWS,
        [
          Query.equal('followerId', user.$id),
          Query.equal('followingId', reel.userId),
        ]
      );
      setFollowing(res.total > 0);
    } catch {}
  };

  const handleLike = async () => {
    if (!user) return;
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
        const doc = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.LIKES,
          ID.unique(),
          { userId: user.$id, postId: reel.$id }
        );
        setLiked(true);
        setLikeId(doc.$id);
        setLikesCount((c) => c + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async () => {
    if (!user || isOwner) return;
    try {
      if (following) {
        const res = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.FOLLOWS,
          [
            Query.equal('followerId', user.$id),
            Query.equal('followingId', reel.userId),
          ]
        );
        if (res.documents.length > 0) {
          await databases.deleteDocument(
            APPWRITE_DATABASE_ID,
            COLLECTIONS.FOLLOWS,
            res.documents[0].$id
          );
        }
        setFollowing(false);
      } else {
        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.FOLLOWS,
          ID.unique(),
          { followerId: user.$id, followingId: reel.userId }
        );
        setFollowing(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this reel?')) return;
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.REELS,
        reel.$id
      );
      onDelete(reel.$id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.reelItem}>
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        style={styles.video}
        loop
        muted={muted}
        playsInline
        onClick={() => setMuted((m) => !m)}
      />

      {/* Gradient overlays */}
      <div style={styles.topGradient} />
      <div style={styles.bottomGradient} />

      {/* Top controls */}
      <div style={styles.topControls}>
        <button
          style={styles.muteBtn}
          onClick={() => setMuted((m) => !m)}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <button
          style={styles.optionsBtn}
          onClick={() => setShowOptions(!showOptions)}
        >
          ⊟
        </button>
      </div>

      {/* Options popup */}
      {showOptions && (
        <div style={styles.optionsMenu}>
          <button
            style={styles.optionItem}
            onClick={() => { setShowOptions(false); }}
          >
            😐 Not Interested
          </button>
          <button
            style={styles.optionItem}
            onClick={() => { setShowOptions(false); }}
          >
            🔇 Mute Profile
          </button>
          <button
            style={styles.optionItem}
            onClick={() => { setShowOptions(false); }}
          >
            ⬇️ Download Reel
          </button>
          {isOwner && (
            <button
              style={{ ...styles.optionItem, color: '#ed4956' }}
              onClick={() => { handleDelete(); setShowOptions(false); }}
            >
              🗑 Delete Reel
            </button>
          )}
          <button
            style={{ ...styles.optionItem, color: 'var(--text-secondary)' }}
            onClick={() => setShowOptions(false)}
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* Right action column */}
      <div style={styles.rightActions}>
        {/* Like */}
        <div style={styles.actionItem}>
          <button onClick={handleLike} style={styles.actionBtn}>
            {liked ? (
              <span style={{ fontSize: '28px' }}>❤️</span>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path
                  d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </button>
          <span style={styles.actionCount}>{likesCount}</span>
        </div>

        {/* Comment */}
        <div style={styles.actionItem}>
          <button style={styles.actionBtn}>
            <svg width="28" height="28" viewBox="0 0 24 24">
              <path
                d="M21 6.5C21 5.12 19.88 4 18.5 4h-13C4.12 4 3 5.12 3 6.5v8C3 15.88 4.12 17 5.5 17H17l4 4V6.5z"
                fill="none"
                stroke="#fff"
                strokeWidth="1.5"
              />
            </svg>
          </button>
          <span style={styles.actionCount}>0</span>
        </div>

        {/* Share */}
        <div style={styles.actionItem}>
          <button style={styles.actionBtn}>
            <svg width="28" height="28" viewBox="0 0 24 24">
              <path
                d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                fill="none"
                stroke="#fff"
                strokeWidth="1.5"
              />
            </svg>
          </button>
          <span style={styles.actionCount}>0</span>
        </div>

        {/* Save */}
        <div style={styles.actionItem}>
          <button
            style={styles.actionBtn}
            onClick={() => setSaved((s) => !s)}
          >
            {saved ? (
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="var(--accent-gold)" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path
                  d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Song info */}
        <div style={styles.actionItem}>
          <button
            style={styles.actionBtn}
            onClick={() => setShowSongInfo(!showSongInfo)}
          >
            <span style={{ fontSize: '24px' }}>≡</span>
          </button>
        </div>
      </div>

      {/* Song/location popup */}
      {showSongInfo && (
        <div style={styles.songPopup}>
          {reel.music && (
            <div style={styles.songRow}>
              <span style={styles.songIcon}>🎵</span>
              <span style={styles.songText}>{reel.music}</span>
            </div>
          )}
          {reel.location && (
            <div style={styles.songRow}>
              <span style={styles.songIcon}>📍</span>
              <span style={styles.songText}>{reel.location}</span>
            </div>
          )}
          {!reel.music && !reel.location && (
            <span style={styles.songText}>No details added</span>
          )}
        </div>
      )}

      {/* Bottom info */}
      <div style={styles.bottomInfo}>
        <div style={styles.userRow}>
          <Link
            to={`/profile/${reel.username}`}
            style={styles.userLink}
          >
            {reel.avatarUrl ? (
              <img src={reel.avatarUrl} alt="avatar" style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {reel.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span style={styles.username}>@{reel.username}</span>
          </Link>

          {!isOwner && (
            <button
              onClick={handleFollow}
              style={{
                ...styles.followBtn,
                background: following ? 'transparent' : 'var(--accent-gold)',
                color: following ? 'var(--accent-gold)' : '#000',
                border: '1.5px solid var(--accent-gold)',
              }}
            >
              {following ? '✓ Following' : '+ Follow'}
            </button>
          )}
        </div>

        {reel.caption && (
          <p style={styles.caption}>{reel.caption}</p>
        )}

        {reel.music && (
          <div style={styles.musicTicker}>
            <span style={styles.musicNote}>🎵</span>
            <span style={styles.musicText}>{reel.music}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Reels = () => {
  const { user, profile } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [form, setForm] = useState({ caption: '', location: '', music: '' });
  const [uploading, setUploading] = useState(false);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    setLoading(true);
    try {
      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.REELS,
        [Query.orderDesc('$createdAt'), Query.limit(20)]
      );

      const enriched = await Promise.all(
        res.documents.map(async (reel) => {
          try {
            const prof = await databases.getDocument(
              APPWRITE_DATABASE_ID,
              COLLECTIONS.PROFILES,
              reel.userId
            );
            return {
              ...reel,
              username: prof.username,
              avatarUrl: prof.avatarUrl || null,
            };
          } catch {
            return { ...reel, username: 'unknown', avatarUrl: null };
          }
        })
      );

      setReels(enriched);
    } catch (err) {
      console.error('Error fetching reels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const index = Math.round(container.scrollTop / window.innerHeight);
      setActiveIndex(index);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleUploadReel = async (e) => {
    e.preventDefault();
    if (!videoFile) return;
    setUploading(true);

    try {
      const uploaded = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        videoFile
      );
      const videoUrl = storage.getFileView(BUCKET_ID, uploaded.$id).toString();

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.REELS,
        ID.unique(),
        {
          userId: user.$id,
          videoUrl,
          caption: form.caption,
          location: form.location,
          music: form.music,
        }
      );

      setVideoFile(null);
      setVideoPreview(null);
      setForm({ caption: '', location: '', music: '' });
      setShowCreate(false);
      await fetchReels();
    } catch (err) {
      console.error('Error uploading reel:', err);
      alert('Failed to upload reel');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (deletedId) => {
    setReels((prev) => prev.filter((r) => r.$id !== deletedId));
  };

  return (
    <div style={styles.page}>
      {/* Fixed top controls */}
      <div style={styles.topBar}>
        <span style={styles.topTitle}>Reels</span>
        <button
          style={styles.createBtn}
          onClick={() => setShowCreate(true)}
        >
          ＋
        </button>
      </div>

      {/* Create reel modal */}
      {showCreate && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Create Reel</span>
              <button
                style={styles.modalClose}
                onClick={() => setShowCreate(false)}
              >
                ✕
              </button>
            </div>

            {videoPreview ? (
              <video
                src={videoPreview}
                style={styles.videoPreview}
                controls
              />
            ) : (
              <div
                style={styles.uploadZone}
                onClick={() => fileInputRef.current?.click()}
              >
                <span style={styles.uploadIcon}>🎬</span>
                <span style={styles.uploadText}>Tap to select a video</span>
                <span style={styles.uploadHint}>MP4, MOV, WEBM up to 50MB</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              style={{ display: 'none' }}
            />

            <form onSubmit={handleUploadReel} style={styles.reelForm}>
              <input
                style={styles.reelInput}
                type="text"
                placeholder="Caption..."
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
              />
              <input
                style={styles.reelInput}
                type="text"
                placeholder="📍 Location (optional)"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <input
                style={styles.reelInput}
                type="text"
                placeholder="🎵 Music/song name (optional)"
                value={form.music}
                onChange={(e) => setForm({ ...form, music: e.target.value })}
              />
              <button
                type="submit"
                style={{
                  ...styles.uploadBtn,
                  opacity: uploading || !videoFile ? 0.5 : 1,
                }}
                disabled={uploading || !videoFile}
              >
                {uploading ? 'Uploading...' : '🎬 Share Reel'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reels feed */}
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.loadingSpinner} />
          <span style={styles.loadingText}>Loading reels...</span>
        </div>
      ) : reels.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🎬</div>
          <p style={styles.emptyTitle}>No reels yet</p>
          <p style={styles.emptyText}>Be the first to share a reel!</p>
          <button
            style={styles.emptyBtn}
            onClick={() => setShowCreate(true)}
          >
            + Create Reel
          </button>
        </div>
      ) : (
        <div ref={containerRef} style={styles.reelsContainer}>
          {reels.map((reel, index) => (
            <ReelItem
              key={reel.$id}
              reel={reel}
              isActive={index === activeIndex}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

const styles = {
  page: {
    background: '#000',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
  },
  topBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    zIndex: 100,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
  },
  topTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'serif',
  },
  createBtn: {
    background: 'var(--accent-gold)',
    border: 'none',
    color: '#000',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    fontSize: '22px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelsContainer: {
    height: '100vh',
    overflowY: 'scroll',
    scrollSnapType: 'y mandatory',
    scrollbarWidth: 'none',
  },
  reelItem: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    scrollSnapAlign: 'start',
    overflow: 'hidden',
    background: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '120px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
    zIndex: 2,
    pointerEvents: 'none',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '300px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
    zIndex: 2,
    pointerEvents: 'none',
  },
  topControls: {
    position: 'absolute',
    top: '60px',
    left: '16px',
    right: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  muteBtn: {
    background: 'rgba(0,0,0,0.4)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsBtn: {
    background: 'rgba(0,0,0,0.4)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    fontSize: '18px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsMenu: {
    position: 'absolute',
    top: '100px',
    right: '16px',
    background: 'rgba(20,20,20,0.95)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '8px',
    zIndex: 10,
    minWidth: '180px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  optionItem: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    padding: '12px 16px',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: '10px',
    width: '100%',
  },
  rightActions: {
    position: 'absolute',
    right: '16px',
    bottom: '140px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    zIndex: 3,
  },
  actionItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  actionCount: {
    fontSize: '12px',
    color: '#fff',
    fontWeight: '600',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
  songPopup: {
    position: 'absolute',
    bottom: '160px',
    left: '16px',
    background: 'rgba(20,20,20,0.9)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 16px',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '240px',
  },
  songRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  songIcon: {
    fontSize: '16px',
  },
  songText: {
    color: '#fff',
    fontSize: '13px',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: '70px',
    left: '16px',
    right: '80px',
    zIndex: 3,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--accent-gold)',
  },
  avatarPlaceholder: {
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
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: '14px',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
  followBtn: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  caption: {
    color: '#fff',
    fontSize: '13px',
    lineHeight: '1.4',
    margin: 0,
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
  musicTicker: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  musicNote: {
    fontSize: '14px',
  },
  musicText: {
    color: '#fff',
    fontSize: '12px',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.9)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modal: {
    background: 'var(--bg-secondary)',
    borderRadius: '24px 24px 0 0',
    width: '100%',
    maxWidth: '614px',
    padding: '20px 20px 40px',
    border: '1px solid var(--border-color)',
    borderBottom: 'none',
    maxHeight: '90vh',
    overflowY: 'auto',
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
  },
  uploadZone: {
    border: '2px dashed var(--border-color)',
    borderRadius: '16px',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  uploadIcon: {
    fontSize: '48px',
  },
  uploadText: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  uploadHint: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  videoPreview: {
    width: '100%',
    maxHeight: '300px',
    borderRadius: '12px',
    marginBottom: '16px',
    background: '#000',
  },
  reelForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  reelInput: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  uploadBtn: {
    background: 'var(--accent-gold)',
    color: '#000',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '16px',
  },
  loadingSpinner: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(255,255,255,0.2)',
    borderTop: '3px solid var(--accent-gold)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '12px',
    paddingBottom: '60px',
  },
  emptyIcon: {
    fontSize: '64px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  emptyText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
  },
  emptyBtn: {
    background: 'var(--accent-gold)',
    color: '#000',
    border: 'none',
    borderRadius: '20px',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default Reels;