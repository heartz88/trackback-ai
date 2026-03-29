import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './components/common/Footer';
import Navigation from './components/common/Navigation';
import ProtectedRoute from './components/common/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';
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
import NotificationsPage from './pages/NotificationsPage';
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
(function fixIosTap() {
  var isIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIos) return;

  // Tag <html> so CSS .ios-touch rules suppress :hover styles
  document.documentElement.classList.add('ios-touch');
  // Classic WebKit trick — makes :active work on all elements
  document.body.setAttribute('ontouchstart', '');

  var CLICKABLE = 'a, button, [role="button"], [role="tab"], [role="menuitem"], label, summary';
  var FOCUSABLE = 'input, textarea, select';

  var _el = null;
  var _t  = 0;

  document.addEventListener('touchstart', function(e) {
    var el = e.target.closest(CLICKABLE + ', ' + FOCUSABLE);
    if (!el) return;
    _el = el;
    _t  = Date.now();
  }, { passive: true, capture: true });

  document.addEventListener('touchend', function(e) {
    if (!_el || Date.now() - _t > 600) { _el = null; return; }

    // Used closest() on BOTH the touchend target and the stored touchstart target.
    // This handles cases where e.target is a child element (e.g. a <span> inside
    // a button) — the hamburger menu was double-tapping because its inner <span>
    // bars were the actual e.target, and iOS was simulating hover on the span.
    var el = e.target.closest(CLICKABLE + ', ' + FOCUSABLE);

    // Fallback: if e.target didn't resolve via closest, check if _el itself is
    // still a valid target (touchstart and touchend on same element hierarchy)
    if (!el && _el) el = _el;
    if (!el) { _el = null; return; }

    // Make sure we're still in the same tap (touchend target must be inside
    // the same interactive element we recorded on touchstart)
    if (!_el.contains(e.target) && e.target !== _el) { _el = null; return; }

    var tag = el.tagName.toLowerCase();
    var isInput = (tag === 'input' || tag === 'textarea' || tag === 'select');

    if (isInput) {
      // For form fields: DON'T preventDefault — the browser needs to
      // open the keyboard. Instead just call focus() immediately so
      // iOS doesn't defer it to a second tap.
      el.focus();
    } else {
      // For buttons/links/labels: prevent Safari's synthetic hover
      // pass and fire the real click straight away.
      e.preventDefault();
      el.click();
    }

    _el = null;
    _t  = 0;
  }, { capture: true });
})();

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <ScrollToTop />
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
                <Route path="/tracks/:trackSlug" element={<ProtectedRoute><TrackDetailPage /></ProtectedRoute>} />
                <Route path="/tracks/:trackSlug/submissions" element={<ProtectedRoute><SubmissionsPage /></ProtectedRoute>} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/resend-verification" element={<ResendVerificationPage />} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
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