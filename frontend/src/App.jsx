import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Followers from './pages/Followers';
import Search from './pages/Search';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Reels from './pages/Reels';
import Pulse from './pages/Pulse';
import Notifications from './pages/Notifications';
import Splash from './pages/Splash';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/flow" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route path="/flow" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
      <Route path="/feed" element={<Navigate to="/flow" replace />} />
      <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
      <Route path="/pulse" element={<ProtectedRoute><Pulse /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/messages/:username" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/:username/followers" element={<ProtectedRoute><Followers /></ProtectedRoute>} />
      <Route path="/:username/following" element={<ProtectedRoute><Followers /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;