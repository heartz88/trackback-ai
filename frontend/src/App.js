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

// iOS Safari One-Tap Fix - ensures taps on interactive elements are registered immediately without delay
(function fixIosTap() {
  var isIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIos) return;

  document.documentElement.classList.add('ios-touch');
  document.body.setAttribute('ontouchstart', '');

  var INTERACTIVE = 'a, button, [role="button"], [role="tab"], [role="menuitem"], label, summary';

  // Track touches
  var _startEl = null;
  var _startT  = 0;
  var _firing  = false; // prevent recursion when we dispatch MouseEvent

  document.addEventListener('touchstart', function(e) {
    if (_firing) return;
    var el = e.target.closest(INTERACTIVE);
    if (!el) return;
    _startEl = el;
    _startT  = Date.now();
  }, { passive: true, capture: true });

  document.addEventListener('touchend', function(e) {
    if (_firing) return;
    if (!_startEl || Date.now() - _startT > 600) { _startEl = null; return; }

    // Resolve the interactive element — walk up from whatever child was tapped
    // (handles hamburger spans, icon SVGs, etc.)
    var el = e.target.closest(INTERACTIVE) || _startEl;
    if (!el) { _startEl = null; return; }

    var tag = el.tagName.toLowerCase();
    var type = (el.getAttribute('type') || '').toLowerCase();

    // Inputs, textareas, selects — let native touch through, just focus them
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      el.focus();
      _startEl = null;
      return;
    }

    // Checkboxes and radio buttons — toggle checked via click() without preventDefault
    if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
      _startEl = null;
      return;
    }

    // For all other interactive elements (buttons, links, labels):
    // 1. Prevent the native touch → mouseover → hover → click chain
    e.preventDefault();

    // 2. Dispatch a real MouseEvent that React's event delegation will catch.
    //    We use MouseEvent instead of el.click() because el.click() on iOS
    //    can be swallowed when called inside a touchend handler that has
    //    already called preventDefault — React 17+ root delegation misses it.
    _firing = true;
    var evt = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      // Pass touch coordinates so any click-position-aware handlers work
      clientX: e.changedTouches[0] ? e.changedTouches[0].clientX : 0,
      clientY: e.changedTouches[0] ? e.changedTouches[0].clientY : 0,
    });
    el.dispatchEvent(evt);
    _firing = false;

    _startEl = null;
    _startT  = 0;
  }, { capture: true });
})();

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