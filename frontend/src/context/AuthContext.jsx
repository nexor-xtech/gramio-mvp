import { createContext, useContext, useEffect, useState } from 'react';
import { account, databases, APPWRITE_DATABASE_ID, COLLECTIONS, ID } from '../lib/appwrite';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      await fetchProfile(currentUser.$id);
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId) => {
    try {
      const res = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.PROFILES,
        userId
      );
      setProfile(res);
    } catch (err) {
      // Self-heal: if profile doc is missing, create it
      if (err.code === 404) {
        try {
          const currentUser = await account.get();
          const fallbackUsername =
            currentUser.name || currentUser.email.split('@')[0];

          const newProfile = await databases.createDocument(
            APPWRITE_DATABASE_ID,
            COLLECTIONS.PROFILES,
            userId,
            {
              userId,
              username: fallbackUsername,
              bio: '',
              avatarUrl: '',
              isPrivate: false,
            }
          );
          setProfile(newProfile);
        } catch (createErr) {
          console.error('Failed to create missing profile:', createErr);
          setProfile(null);
        }
      } else {
        console.error('Error fetching profile:', err);
        setProfile(null);
      }
    }
  };

  const signup = async (email, password, username) => {
    const newUser = await account.create(ID.unique(), email, password, username);
    await account.createEmailPasswordSession(email, password);

    const newProfile = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.PROFILES,
      newUser.$id,
      {
        userId: newUser.$id,
        username,
        bio: '',
        avatarUrl: '',
        isPrivate: false,
      }
    );

    setUser(newUser);
    setProfile(newProfile);
    return newProfile;
  };

  const login = async (email, password) => {
    await account.createEmailPasswordSession(email, password);
    const currentUser = await account.get();
    setUser(currentUser);
    await fetchProfile(currentUser.$id);
  };

  const logout = async () => {
    await account.deleteSession('current');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signup, login, logout, fetchProfile }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);