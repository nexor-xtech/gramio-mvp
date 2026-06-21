import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const STORY_DURATION = 5000;

const StoryViewer = ({ groups, initialGroupIndex, onClose }) => {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];

  useEffect(() => {
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (paused) return;

    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + (100 / (STORY_DURATION / 50));
      });
    }, 50);

    return () => clearInterval(intervalRef.current);
  }, [groupIndex, storyIndex, paused]);

  const goNext = () => {
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((g) => g - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const handleClick = (e) => {
    const { clientX, currentTarget } = e;
    const { left, width } = currentTarget.getBoundingClientRect();
    const clickPos = (clientX - left) / width;
    if (clickPos < 0.3) {
      goPrev();
    } else {
      goNext();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [groupIndex, storyIndex]);

  if (!group || !story) return null;

  return (
    <div style={styles.overlay}>
      {/* Left arrow (prev user) */}
      {groupIndex > 0 && (
        <button
          style={{ ...styles.navArrow, left: '16px' }}
          onClick={(e) => {
            e.stopPropagation();
            setGroupIndex((g) => g - 1);
            setStoryIndex(0);
          }}
        >
          ‹
        </button>
      )}

      <div
        style={styles.container}
        onClick={handleClick}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Progress bars */}
        <div style={styles.progressRow}>
          {group.stories.map((_, i) => (
            <div key={i} style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width:
                    i < storyIndex
                      ? '100%'
                      : i === storyIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={styles.header}>
          <Link
            to={`/profile/${group.username}`}
            style={styles.userInfo}
            onClick={(e) => e.stopPropagation()}
          >
            {group.avatarUrl ? (
              <img src={group.avatarUrl} alt="avatar" style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {group.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div style={styles.userText}>
              <span style={styles.username}>@{group.username}</span>
              <span style={styles.storyTime}>
                {new Date(story.$createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </Link>

          <div style={styles.headerRight}>
            {/* Pause/play indicator */}
            <div style={styles.pauseIndicator}>
              {paused ? '⏸' : '▶'}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              style={styles.closeBtn}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Story image */}
        <img src={story.mediaUrl} alt="story" style={styles.media} />

        {/* Gradient overlays */}
        <div style={styles.topGradient} />
        <div style={styles.bottomGradient} />

        {/* Story counter */}
        <div style={styles.counter}>
          {storyIndex + 1} / {group.stories.length}
        </div>

        {/* Tap hint */}
        <div style={styles.tapHints}>
          <div style={styles.tapLeft} />
          <div style={styles.tapRight} />
        </div>
      </div>

      {/* Right arrow (next user) */}
      {groupIndex < groups.length - 1 && (
        <button
          style={{ ...styles.navArrow, right: '16px' }}
          onClick={(e) => {
            e.stopPropagation();
            setGroupIndex((g) => g + 1);
            setStoryIndex(0);
          }}
        >
          ›
        </button>
      )}
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  container: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    height: '100vh',
    maxHeight: '860px',
    background: '#000',
    borderRadius: '0',
    overflow: 'hidden',
    cursor: 'pointer',
    userSelect: 'none',
  },
  progressRow: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    right: '12px',
    display: 'flex',
    gap: '4px',
    zIndex: 3,
  },
  progressTrack: {
    flex: 1,
    height: '2px',
    background: 'rgba(255,255,255,0.3)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--accent-gold)',
    transition: 'width 0.05s linear',
    borderRadius: '2px',
  },
  header: {
    position: 'absolute',
    top: '24px',
    left: '12px',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
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
    border: '2px solid var(--accent-gold)',
  },
  userText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: '14px',
  },
  storyTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '11px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pauseIndicator: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
  },
  closeBtn: {
    background: 'rgba(0,0,0,0.4)',
    border: 'none',
    color: '#fff',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    background: '#000',
    display: 'block',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '120px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
    zIndex: 2,
    pointerEvents: 'none',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
    zIndex: 2,
    pointerEvents: 'none',
  },
  counter: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    zIndex: 3,
    background: 'rgba(0,0,0,0.3)',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  tapHints: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    zIndex: 1,
    pointerEvents: 'none',
  },
  tapLeft: {
    flex: '0 0 30%',
  },
  tapRight: {
    flex: 1,
  },
  navArrow: {
    position: 'fixed',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#fff',
    fontSize: '40px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    backdropFilter: 'blur(4px)',
  },
};

export default StoryViewer;