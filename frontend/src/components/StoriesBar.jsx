import { useState, useEffect, useRef } from 'react';
import { databases, APPWRITE_DATABASE_ID, COLLECTIONS, Query, ID, storage, BUCKET_ID } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import StoryViewer from './StoryViewer';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const StoriesBar = () => {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS).toISOString();

      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.STORIES,
        [
          Query.greaterThan('$createdAt', cutoff),
          Query.orderDesc('$createdAt'),
          Query.limit(100),
        ]
      );

      const byUser = {};
      res.documents.forEach((story) => {
        if (!byUser[story.userId]) byUser[story.userId] = [];
        byUser[story.userId].push(story);
      });

      Object.values(byUser).forEach((arr) =>
        arr.sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt))
      );

      const userIds = Object.keys(byUser);
      const groupsData = await Promise.all(
        userIds.map(async (uid) => {
          try {
            const prof = await databases.getDocument(
              APPWRITE_DATABASE_ID,
              COLLECTIONS.PROFILES,
              uid
            );
            return {
              userId: uid,
              username: prof.username,
              avatarUrl: prof.avatarUrl || null,
              stories: byUser[uid],
            };
          } catch {
            return {
              userId: uid,
              username: 'unknown',
              avatarUrl: null,
              stories: byUser[uid],
            };
          }
        })
      );

      groupsData.sort((a, b) => {
        if (a.userId === user?.$id) return -1;
        if (b.userId === user?.$id) return 1;
        return 0;
      });

      setGroups(groupsData);
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const myGroup = groups.find((g) => g.userId === user?.$id);

  const handleAddStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);
      const mediaUrl = storage.getFileView(BUCKET_ID, uploaded.$id).toString();

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.STORIES,
        ID.unique(),
        { userId: user.$id, mediaUrl }
      );

      await fetchStories();
    } catch (err) {
      console.error('Error uploading story:', err);
      alert('Failed to upload story');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const openViewer = (groupUserId) => {
    const index = groups.findIndex((g) => g.userId === groupUserId);
    if (index !== -1) setViewerIndex(index);
  };

  if (loading) return null;

  return (
    <>
      <div style={styles.bar}>
        {/* Your story */}
        <div style={styles.storyItem}>
          <div style={styles.myStoryWrapper}>
            <div
              style={{
                ...styles.ring,
                background: myGroup
                  ? 'linear-gradient(45deg, var(--accent-gold), #f4d160, var(--accent-gold))'
                  : 'var(--border-color)',
                cursor: myGroup ? 'pointer' : 'default',
              }}
              onClick={() => myGroup && openViewer(user.$id)}
            >
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="you" style={styles.avatar} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {profile?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            {/* Add button */}
            <button
              style={styles.addBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Add story"
            >
              {uploading ? (
                <span style={styles.uploadingDot} />
              ) : (
                '+'
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAddStory}
              style={{ display: 'none' }}
            />
          </div>
          <span style={styles.label}>
            {uploading ? 'Uploading...' : 'Your story'}
          </span>
        </div>

        {/* Divider */}
        {groups.filter((g) => g.userId !== user?.$id).length > 0 && (
          <div style={styles.divider} />
        )}

        {/* Other users */}
        {groups
          .filter((g) => g.userId !== user?.$id)
          .map((group) => (
            <div
              key={group.userId}
              style={styles.storyItem}
              onClick={() => openViewer(group.userId)}
            >
              <div
                style={{
                  ...styles.ring,
                  background: 'linear-gradient(45deg, var(--accent-gold), #f4d160, var(--accent-gold))',
                  cursor: 'pointer',
                }}
              >
                {group.avatarUrl ? (
                  <img src={group.avatarUrl} alt={group.username} style={styles.avatar} />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    {group.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <span style={styles.label}>{group.username}</span>
            </div>
          ))}
      </div>

      {viewerIndex !== null && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
};

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    overflowX: 'auto',
    padding: '16px 4px',
    marginBottom: '12px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  storyItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
    cursor: 'pointer',
    width: '68px',
  },
  myStoryWrapper: {
    position: 'relative',
    width: '64px',
    height: '64px',
  },
  ring: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    padding: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--bg-primary)',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'var(--bg-hover)',
    color: 'var(--accent-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '22px',
    border: '2px solid var(--bg-primary)',
  },
  addBtn: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--accent-gold)',
    color: '#000',
    border: '2px solid var(--bg-primary)',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
  },
  uploadingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#000',
    animation: 'pulse 0.8s infinite',
  },
  label: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    width: '68px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  divider: {
    width: '1px',
    height: '48px',
    background: 'var(--border-color)',
    alignSelf: 'center',
    flexShrink: 0,
    marginTop: '-6px',
  },
};

export default StoriesBar;