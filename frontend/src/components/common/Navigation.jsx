import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

function Navigation() {
const { user, logout } = useAuth();
const { unreadCount } = useSocket();
const navigate = useNavigate();
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
const [scrolled, setScrolled] = useState(false);
const [avatarError, setAvatarError] = useState(false); // Add state for avatar error
const profileMenuRef = useRef(null);

useEffect(() => {
const handleScroll = () => {
    setScrolled(window.scrollY > 20);
};
window.addEventListener('scroll', handleScroll);
return () => window.removeEventListener('scroll', handleScroll);
}, []);

useEffect(() => {
const handleClickOutside = (event) => {
    if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
    setIsProfileMenuOpen(false);
    }
};
document.addEventListener('mousedown', handleClickOutside);
return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

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
setIsProfileMenuOpen(false);
};

const toggleMenu = () => {
setIsMenuOpen(!isMenuOpen);
setIsProfileMenuOpen(false);
};

const closeMenu = () => {
setIsMenuOpen(false);
};

const toggleProfileMenu = () => {
setIsProfileMenuOpen(!isProfileMenuOpen);
};

// Reset avatar error when user changes
useEffect(() => {
setAvatarError(false);
}, [user?.avatar_url]);

const HamburgerIcon = () => (
<button
    onClick={toggleMenu}
    className="md:hidden relative w-11 h-11 flex items-center justify-center rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] transition-all duration-300 group"
    aria-label="Toggle menu"
>
    <div className="relative w-5 h-5">
    <span className={`absolute left-0 w-5 h-0.5 bg-[var(--text-primary)] rounded-full transform transition-all duration-300 ${
        isMenuOpen ? 'rotate-45 top-2.5' : 'rotate-0 top-1'
    }`} />
    <span className={`absolute left-0 w-5 h-0.5 bg-[var(--text-primary)] rounded-full transform transition-all duration-300 ${
        isMenuOpen ? 'opacity-0' : 'opacity-100 top-2.5'
    }`} />
    <span className={`absolute left-0 w-5 h-0.5 bg-[var(--text-primary)] rounded-full transform transition-all duration-300 ${
        isMenuOpen ? '-rotate-45 top-2.5' : 'rotate-0 top-4'
    }`} />
    </div>
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
    <div className="flex items-end space-x-0.5 h-4">
        <span className="w-0.5 h-2 bg-[var(--accent-primary)] rounded-full animate-waveform" />
        <span className="w-0.5 h-3 bg-[var(--accent-primary-light)] rounded-full animate-waveform" />
        <span className="w-0.5 h-4 bg-[var(--accent-primary)] rounded-full animate-waveform" />
    </div>
    </div>
</button>
);

return (
<>
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
    scrolled
        ? 'bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--border-color)]/50 shadow-lg' 
        : 'bg-[var(--bg-primary)] border-b border-[var(--border-color)]/10'
    }`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
        {/* Brand */}
        <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 group" onClick={closeMenu}>
            <div className="relative">
                <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <img src={logo} className="w-full h-full object-cover rounded-xl" alt="Trackback AI"/>
                </div>
            </div>
            <div>
                <span className="text-xl font-bold tracking-tight">
                <span className="text-[var(--text-primary)]">Track</span>
                <span className="text-[var(--accent-primary)]">Back</span>
                <span className="text-[var(--text-secondary)]">AI</span>
                </span>
            </div>
            </Link>

            {/* Desktop Navigation Links */}
            {user && (
            <div className="hidden md:flex items-center space-x-1">
                <NavLink to="/discover">Discover</NavLink>
                <NavLink to="/upload">Upload</NavLink>
                <NavLink to="/my-tracks">My Tracks</NavLink>
                <NavLink to="/collaborations">Collabs</NavLink>
                <NavLink to="/messages" badge={unreadCount}>Messages</NavLink>
                <NavLink to="/community">Community</NavLink>
            </div>
            )}
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />

            {user ? (
            <>
                <NotificationBell />

                {/* Profile Dropdown - FIXED AVATAR SECTION */}
                <div className="relative" ref={profileMenuRef}>
                <button
                    onClick={toggleProfileMenu}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] transition-all duration-300 border border-transparent hover:border-[var(--accent-primary)]/30 group"
                >
                    <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary-dark)] to-[var(--accent-primary)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20 overflow-hidden">
                        {/* FIXED: Better avatar handling */}
                        {user.avatar_url && !avatarError ? (
                        <img 
                            src={user.avatar_url} 
                            alt={user.username} 
                            className="w-full h-full object-cover"
                            onError={() => setAvatarError(true)}
                            onLoad={() => setAvatarError(false)}
                        />
                        ) : (
                        <span className="text-white text-sm font-bold">
                            {user.username?.[0]?.toUpperCase() || '?'}
                        </span>
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--bg-primary)]" />
                    </div>
                    <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors max-w-[100px] truncate">
                    {user.username}
                    </span>
                    <svg className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-300 ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl overflow-hidden animate-scale-in">
                    <div className="p-2">
                        <Link
                        to={`/profile/${user.username}`}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
                        >
                        <svg className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-medium text-[var(--text-primary)]">Your Profile</span>
                        </Link>

                        <Link
                        to="/edit-profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
                        >
                        <svg className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium text-[var(--text-primary)]">Settings</span>
                        </Link>

                        <div className="border-t border-[var(--border-color)] my-2"></div>

                        <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors group"
                        >
                        <svg className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-sm font-medium text-red-500">Sign Out</span>
                        </button>
                    </div>
                    </div>
                )}
                </div>
            </>
            ) : (
            <>
                <Link 
                to="/community" 
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
                >Community
                </Link>
                <Link 
                to="/login" 
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
                >
                Sign In
                </Link>
                <Link 
                to="/register" 
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[var(--accent-primary-dark)] to-[var(--accent-primary)] hover:from-[var(--accent-primary)] hover:to-[var(--accent-primary-light)] text-white font-medium transition-all duration-300 shadow-lg shadow-[var(--accent-primary)]/20 hover:shadow-[var(--accent-primary)]/30"
                >
                Get Started
                </Link>
            </>
            )}
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center space-x-2">
            <div className="flex-shrink-0"><ThemeToggle /></div>
            {user && <NotificationBell />}
            <HamburgerIcon />
        </div>
        </div>
    </div>
    </nav>

    {/* Mobile Menu Overlay - FIXED MOBILE AVATAR SECTION */}
    <div className={`md:hidden fixed inset-0 z-40 transition-all duration-500 ${
    isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
    }`}>
    <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500 ${
        isMenuOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeMenu}
    />
    
    <div className={`absolute top-0 right-0 h-full w-4/5 max-w-sm bg-[var(--bg-primary)] border-l border-[var(--border-color)] shadow-2xl transform transition-all duration-500 ease-out ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
        
        <div className="p-6 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-primary-dark)] to-[var(--accent-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
            </div>
            <div>
                <span className="text-lg font-bold">
                <span className="text-[var(--text-primary)]">Track</span>
                <span className="text-[var(--accent-primary)]">Back</span>
                <span className="text-[var(--text-secondary)]">AI</span>
                </span>
                <p className="text-xs text-[var(--text-tertiary)]">Music Collaboration</p>
            </div>
            </div>
            <button
            onClick={closeMenu}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] transition-colors"
            aria-label="Close menu"
            >
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
        </div>

        {user && (
            <Link 
            to={`/profile/${user.username}`} 
            onClick={closeMenu}
            className="block p-4 rounded-xl bg-gradient-to-r from-[var(--accent-primary)]/5 to-transparent border border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 transition-all duration-300"
            >
            <div className="flex items-center space-x-3">
                <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary-dark)] to-[var(--accent-primary)] flex items-center justify-center shadow-lg overflow-hidden">
                    {/* FIXED: Better avatar handling for mobile */}
                    {user.avatar_url && !avatarError ? (
                    <img 
                        src={user.avatar_url} 
                        alt={user.username} 
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                        onLoad={() => setAvatarError(false)}
                    />
                    ) : (
                    <span className="text-white text-lg font-bold">
                        {user.username?.[0]?.toUpperCase() || '?'}
                    </span>
                    )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[var(--bg-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--text-primary)] truncate">{user.username}</h3>
                <p className="text-xs text-[var(--text-tertiary)] truncate">{user.email}</p>
                </div>
                <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
            </Link>
        )}
        </div>

        <div className="p-4 space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
        {user ? (
            <>
            <MenuItem to="/discover" onClick={closeMenu}>Discover</MenuItem>
            <MenuItem to="/upload" onClick={closeMenu}>Upload Track</MenuItem>
            <MenuItem to="/my-tracks" onClick={closeMenu}>My Tracks</MenuItem>
            <MenuItem to="/collaborations" onClick={closeMenu}>Collaborations</MenuItem>
            <MenuItem to="/messages" badge={unreadCount} onClick={closeMenu}>Messages</MenuItem>
            <MenuItem to={`/profile/${user.username}`} onClick={closeMenu}>Profile</MenuItem>
            <MenuItem to="/community" onClick={closeMenu}>Community</MenuItem>
            <MenuItem to="/edit-profile" onClick={closeMenu}>Settings</MenuItem>
            
            <div className="pt-4 mt-4 border-t border-[var(--border-color)]">
                <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-red-500 hover:bg-red-500/10 rounded-xl transition-colors group"
                >
                <span className="font-medium">Sign Out</span>
                <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                </button>
            </div>
            </>
        ) : (
            <>
            <MenuItem to="/community" onClick={closeMenu}>Community</MenuItem>
            <MenuItem to="/login" onClick={closeMenu}>Sign In</MenuItem>
            <MenuItem to="/register" onClick={closeMenu}>Join Now</MenuItem>
            </>
        )}
        </div>
    </div>
    </div>
</>
);
}

// Desktop nav link
const NavLink = ({ to, children, badge }) => (
<Link
to={to}
className="relative px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
>
{children}
{badge > 0 && (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
    {badge > 9 ? '9+' : badge}
    </span>
)}
<span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-[var(--accent-primary-dark)] to-[var(--accent-primary)] rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
</Link>
);

// Mobile Menu Item
const MenuItem = ({ to, children, badge, onClick }) => (
<Link
to={to}
onClick={onClick}
className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-tertiary)] rounded-xl transition-all duration-300 group"
>
<span className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
    {children}
</span>
<div className="flex items-center space-x-2">
    {badge > 0 && (
    <span className="min-w-[22px] h-[22px] px-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
        {badge > 9 ? '9+' : badge}
    </span>
    )}
    <svg className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
</div>
</Link>
);

export default Navigation;