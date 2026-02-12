import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './components/common/Footer';
import Navigation from './components/common/Navigation';
import ProtectedRoute from './components/common/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import CollaborationsPage from './pages/CollaborationsPage';
import DiscoverPage from './pages/DiscoverPage';
import EditProfilePage from './pages/EditProfilePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MessagesPage from './pages/MessagesPage';
import MyTracksPage from './pages/MyTracksPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import SubmissionsPage from './pages/SubmissionsPage';
import TrackDetailPage from './pages/TrackDetailPage';
import UploadPage from './pages/UploadPage';

function App() {
  // Set initial theme class on document
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
            <Navigation />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
              <Route path="/my-tracks" element={<ProtectedRoute><MyTracksPage /></ProtectedRoute>} />
              <Route path="/collaborations" element={<ProtectedRoute><CollaborationsPage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/messages/:conversationId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
              <Route path = "/profile/:userid" element= {<ProtectedRoute><ProfilePage/></ProtectedRoute>}/>
              <Route path="/tracks/:trackId" element={<ProtectedRoute><TrackDetailPage /></ProtectedRoute>} />
              <Route path="/tracks/:trackId/submissions" element={<ProtectedRoute><SubmissionsPage /></ProtectedRoute>} />
            </Routes>
          </div>
          <Footer />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;