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
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SubmissionsPage from './pages/SubmissionsPage';
import TrackDetailPage from './pages/TrackDetailPage';
import UploadPage from './pages/UploadPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

(function applyTheme() {
  const saved = localStorage.getItem('theme');
  const html = document.documentElement;
  if (saved === 'light') {
    html.classList.add('light');
    html.classList.remove('dark');
  } else {
    html.classList.add('dark');
    html.classList.remove('light');
  }
})();

// ─── iOS Safari Double-Tap Fix ────────────────────────────────────────────────
// iOS Safari intercepts the first tap on any element that has a :hover CSS rule
// and uses it to simulate a hover state instead of firing a click. The user must
// tap again to actually trigger the click. This happens even for colour-only
// hover changes, and Tailwind generates hundreds of hover: utility classes we
// cannot fully control via CSS alone.
//
// Strategy:
// 1. Detect iOS and tag <html> with .ios-touch so CSS can suppress :hover rules.
// 2. Add body ontouchstart="" — classic iOS trick that enables :active on all elements.
// 3. Attach a document touchend listener that calls element.click() immediately,
//    preventing Safari from intercepting the tap as a hover simulation.
// ─────────────────────────────────────────────────────────────────────────────
(function fixIosDoubleTap() {
  const isIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIos) return;

  // Tag html so our CSS @media block and .ios-touch rules apply
  document.documentElement.classList.add('ios-touch');

  // Enables :active pseudo-class on all elements in older iOS WebKit
  document.body.setAttribute('ontouchstart', '');

  let touchStartTarget = null;
  let touchStartTime = 0;

  document.addEventListener('touchstart', function (e) {
    const el = e.target.closest(
      'a, button, [role="button"], [role="tab"], [role="menuitem"], input, select, textarea, label'
    );
    if (!el) return;
    touchStartTarget = el;
    touchStartTime = Date.now();
  }, { passive: true, capture: true });

  document.addEventListener('touchend', function (e) {
    const el = e.target.closest(
      'a, button, [role="button"], [role="tab"], [role="menuitem"], input, select, textarea, label'
    );
    if (!el || el !== touchStartTarget) return;
    if (Date.now() - touchStartTime > 600) return; // ignore long-press / context menu

    const tag = el.tagName.toLowerCase();
    const isNativeInput = tag === 'input' || tag === 'textarea' || tag === 'select';

    if (!isNativeInput) {
      // For links, buttons, labels: prevent the synthetic hover pass and fire click directly
      e.preventDefault();
      el.click();
    }
    // For inputs/textareas/selects: let the native touch event through so the
    // keyboard opens and focus is set correctly — they don't suffer the hover trap

    touchStartTarget = null;
    touchStartTime = 0;
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