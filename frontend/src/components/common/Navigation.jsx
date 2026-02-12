import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import ThemeToggle from './ThemeToggle';

function Navigation() {
const { user, logout } = useAuth();
const { unreadCount } = useSocket();
const navigate = useNavigate();
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [scrolled, setScrolled] = useState(false);

// Handle scroll effect for navbar
useEffect(() => {
const handleScroll = () => {
    setScrolled(window.scrollY > 20);
};
window.addEventListener('scroll', handleScroll);
return () => window.removeEventListener('scroll', handleScroll);
}, []);

// Prevent body scroll when menu is open
useEffect(() => {
if (isMenuOpen) {
    document.body.style.overflow = 'hidden';
} else {
    document.body.style.overflow = 'unset';
}
return () => {
    document.body.style.overflow = 'unset';
};
}, [isMenuOpen]);

const handleLogout = () => {
logout();
navigate('/login');
setIsMenuOpen(false);
};

const toggleMenu = () => {
setIsMenuOpen(!isMenuOpen);
};

const closeMenu = () => {
setIsMenuOpen(false);
};

// Music-themed Hamburger Icon
const HamburgerIcon = () => (
<button
    onClick={toggleMenu}
    className="md:hidden flex flex-col justify-center items-center w-12 h-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 relative group"
    aria-label="Toggle menu"
>
    <div className="relative w-8 h-8 flex items-center justify-center">
    <span className={`absolute w-6 h-0.5 bg-current rounded-full transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-0 w-4' : 'translate-y-[-8px]'}`} />
    <span className={`absolute w-6 h-0.5 bg-current rounded-full transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
    <span className={`absolute w-6 h-0.5 bg-current rounded-full transition-all duration-300 ${isMenuOpen ? '-rotate-45 translate-y-0 w-4' : 'translate-y-[8px]'}`} />
    <span className={`absolute w-2 h-2 bg-primary-500 rounded-full transition-all duration-300 ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
    </div>
    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/10 to-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
</button>
);

return (
<>
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--border-color)] shadow-lg' : 'bg-[var(--bg-primary)] border-b border-[var(--border-color)]/50 backdrop-blur-lg'}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-12">
            <Link to="/" className="flex items-center space-x-3" onClick={closeMenu}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                TrackBackAI
            </span>
            </Link>

            {/* Desktop Navigation Links */}
            {user && (
            <div className="hidden md:flex items-center space-x-8">
                <Link to="/discover" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium relative group">
                Discover
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/upload" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium relative group">
                Upload
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/my-tracks" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium relative group">
                My Tracks
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/collaborations" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium relative group">
                Collaborations
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/messages" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium relative group">
                Messages
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg shadow-red-500/20">
                    {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
            </div>
            )}
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            
            {user ? (
            <>
                <Link to={`/profile/${user.id}`}>
                <div className="flex items-center space-x-3 px-4 py-2 bg-[var(--bg-tertiary)] rounded-full border border-[var(--border-color)] hover:border-primary-500/30 transition-all duration-300 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <span className="text-white text-sm font-bold">{user.username[0].toUpperCase()}</span>
                    </div>
                    <span className="text-[var(--text-secondary)] text-sm font-medium group-hover:text-[var(--text-primary)] transition-colors">
                    {user.username}
                    </span>
                </div>
                </Link>
                <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded-full font-medium transition-all border border-[var(--border-color)] hover:border-primary-500/30"
                >
                Logout
                </button>
            </>
            ) : (
            <>
                <Link to="/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium">
                Login
                </Link>
                <Link to="/register" className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-full font-medium transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30">
                Get Started
                </Link>
            </>
            )}
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center space-x-4">
            {user && unreadCount > 0 && (
            <Link to="/messages" className="relative">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500/10 to-primary-600/10">
                <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                </svg>
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            </Link>
            )}
            <ThemeToggle />
            <HamburgerIcon />
        </div>
        </div>
    </div>
    </nav>

    {/* Mobile Menu Overlay */}
    <div className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
    {/* Backdrop */}
    <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeMenu}
    />
    
    {/* Menu Panel */}
    <div className={`absolute top-0 right-0 h-full w-4/5 max-w-sm bg-[var(--bg-primary)] border-l border-[var(--border-color)] shadow-2xl transform transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Menu Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            </div>
            <div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                TrackBackAI
            </span>
            <p className="text-sm text-[var(--text-tertiary)]">Music Community</p>
            </div>
        </div>
        <button
            onClick={closeMenu}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--bg-tertiary)] transition-colors duration-200"
            aria-label="Close menu"
        >
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        </div>

        {/* User Info Section */}
        {user && (
        <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-primary-500/5 to-primary-600/5">
            <Link to={`/profile/${user.id}`} onClick={closeMenu} className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/20">
                <span className="text-white text-lg font-bold">{user.username[0].toUpperCase()}</span>
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)]">{user.username}</h3>
                <p className="text-sm text-[var(--text-tertiary)] truncate">{user.email}</p>
            </div>
            <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            </Link>
        </div>
        )}

        {/* Menu Items */}
        <div className="p-4 space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto">
        {user ? (
            <>
            <MenuItem to="/discover" icon="🎵" onClick={closeMenu}>
                Discover
            </MenuItem>
            <MenuItem to="/upload" icon="📤" onClick={closeMenu}>
                Upload Track
            </MenuItem>
            <MenuItem to="/my-tracks" icon="🎧" onClick={closeMenu}>
                My Tracks
            </MenuItem>
            <MenuItem to="/collaborations" icon="🤝" onClick={closeMenu}>
                Collaborations
            </MenuItem>
            <MenuItem to="/messages" icon="💬" badge={unreadCount} onClick={closeMenu}>
                Messages
            </MenuItem>
            <MenuItem to={`/profile/${user.id}`} icon="👤" onClick={closeMenu}>
                Profile
            </MenuItem>
            <MenuItem to="/edit-profile" icon="⚙️" onClick={closeMenu}>
                Settings
            </MenuItem>
            
            {/* Divider */}
            <div className="pt-4 mt-4 border-t border-[var(--border-color)]">
                <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-500 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                >
                <span className="text-lg">🚪</span>
                <span className="font-medium">Logout</span>
                </button>
            </div>
            </>
        ) : (
            <>
            <MenuItem to="/discover" icon="🎵" onClick={closeMenu}>
                Discover
            </MenuItem>
            <MenuItem to="/login" icon="🔐" onClick={closeMenu}>
                Login
            </MenuItem>
            <MenuItem to="/register" icon="🚀" onClick={closeMenu}>
                Get Started
            </MenuItem>
            </>
        )}
        </div>
    </div>
    </div>
</>
);
}

// Mobile Menu Item Component
const MenuItem = ({ to, icon, children, badge, onClick }) => (
<Link
to={to}
onClick={onClick}
className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors duration-200 group"
>
<div className="flex items-center space-x-3">
    <span className="text-xl">{icon}</span>
    <span className="font-medium text-[var(--text-primary)]">{children}</span>
</div>
<div className="flex items-center space-x-2">
    {badge > 0 && (
    <span className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
        {badge > 9 ? '9+' : badge}
    </span>
    )}
    <svg className="w-4 h-4 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
</div>
</Link>
);

export default Navigation;