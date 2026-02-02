import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import ThemeToggle from './ThemeToggle';

function Navigation() {
const { user, logout } = useAuth();
const { unreadCount } = useSocket();
const navigate = useNavigate();

const handleLogout = () => {
logout();
navigate('/login');
};

return (
<nav className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-6">
    <div className="flex justify-between items-center h-20">
        <div className="flex items-center space-x-12">
        <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            TrackBackAI
            </span>
        </Link>
        {user && (
            <div className="hidden md:flex items-center space-x-8">
            <Link to="/discover" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium">
                Discover
            </Link>
            <Link to="/upload" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium">
                Upload
            </Link>
            <Link to="/my-tracks" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium">
                My Tracks
            </Link>
            <Link to="/collaborations" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium">
                Collaborations
            </Link>
            <Link to="/messages" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium relative">
                Messages
                {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
                )}
            </Link>
            </div>
        )}
        </div>
        <div className="flex items-center space-x-4">
        <ThemeToggle />
        
        {user ? (
            <>
            <Link to={`/profile/${user.id}`}>
            <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-[var(--bg-tertiary)] rounded-full border border-[var(--border-color)]">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{user.username[0].toUpperCase()}</span>
                </div>
                <span className="text-[var(--text-secondary)] text-sm font-medium">{user.username}</span>
            </div>
            </Link>
            <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-[var(--bg-tertiary)] hover:opacity-80 text-[var(--text-primary)] rounded-full font-medium transition-all border border-[var(--border-color)]"
            >
                Logout
            </button>
            </>
        ) : (
            <>
            <Link to="/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium">
                Login
            </Link>
            <Link to="/register" className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-full font-medium transition-all shadow-lg shadow-primary-500/20">
                Get Started
            </Link>
            </>
        )}
        </div>
    </div>
    </div>
</nav>
);
}

export default Navigation;