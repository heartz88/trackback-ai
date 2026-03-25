import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './components/common/Footer';
import Navigation from './components/common/Navigation';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ConfirmModal, ToastContainer } from './components/common/Toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import CollaborationsPage from './pages/CollaborationsPage';
import CommunityPage from './pages/CommunityPage';
import DiscoverPage from './pages/DiscoverPage';
import EditProfilePage from './pages/EditProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MessagesPage from './pages/MessagesPage';
import MyTracksPage from './pages/MyTracksPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SubmissionsPage from './pages/SubmissionsPage';
import TrackDetailPage from './pages/TrackDetailPage';
import UploadPage from './pages/UploadPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

(function applyTheme() {
  var saved = localStorage.getItem('theme');
  var html = document.documentElement;
  if (saved === 'light') {
    html.classList.add('light');
    html.classList.remove('dark');
  } else {
    html.classList.add('dark');
    html.classList.remove('light');
  }
})();

// iOS Safari One-Tap Fix
// Safari fires a synthetic hover pass on first tap of any element with a
// :hover CSS rule, consuming the tap without firing onClick.
// Fix: fire el.click() on touchend before Safari can intercept it.
// The other half of the fix is in index.html: removing user-scalable=no
// and maximum-scale=1 from the viewport meta, which were disabling the
// browser-native fast-tap behaviour.
// (function fixIosTap() {
//   var isIos =
//     /iphone|ipad|ipod/i.test(navigator.userAgent) ||
//     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
//   if (!isIos) return;

//   document.documentElement.classList.add('ios-touch');
//   document.body.setAttribute('ontouchstart', '');

//   var _el = null;
//   var _t = 0;

//   document.addEventListener('touchstart', function(e) {
//     var el = e.target.closest('a, button, [role="button"], [role="tab"], [role="menuitem"]');
//     if (!el) return;
//     _el = el;
//     _t = Date.now();
//   }, { passive: true, capture: true });

//   document.addEventListener('touchend', function(e) {
//     var el = e.target.closest('a, button, [role="button"], [role="tab"], [role="menuitem"]');
//     if (!el || el !== _el || Date.now() - _t > 500) { _el = null; return; }
//     e.preventDefault();
//     el.click();
//     _el = null;
//     _t = 0;
//   }, { capture: true });
// })();

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
            <Navigation />
            <main className="flex-grow pt-20">
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
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
                <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/tracks/:trackId" element={<ProtectedRoute><TrackDetailPage /></ProtectedRoute>} />
                <Route path="/tracks/:trackId/submissions" element={<ProtectedRoute><SubmissionsPage /></ProtectedRoute>} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/resend-verification" element={<ResendVerificationPage />} />
              </Routes>
            </main>
            <Footer />
            <ToastContainer />
            <ConfirmModal />
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;