import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

function Footer() {
const currentYear = new Date().getFullYear();

return (
<footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    {/* Main Footer Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
        {/* Brand Column */}
        <div className="lg:col-span-5 space-y-6">
        <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <img src={logo} className="w-full h-full object-cover rounded-xl" alt="TrackBack AI" />
            </div>
            </div>
            <div>
            <span className="text-2xl font-bold tracking-tight">
                <span className="text-[var(--text-primary)]">Track</span>
                <span className="text-[var(--accent-primary)]">Back</span>
                <span className="text-[var(--text-secondary)]">AI</span>
            </span>
            </div>
        </Link>
        
        <p className="text-[var(--text-secondary)] leading-relaxed max-w-md">
            AI-powered platform helping music producers complete their unfinished tracks through intelligent collaboration and creative matching.
        </p>
        
        <div className="flex gap-3">
            <a
            href="https://github.com/heartz88/trackback-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 bg-[var(--bg-tertiary)] hover:bg-[var(--accent-primary)]/10 rounded-xl flex items-center justify-center transition-all duration-300 border border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 group"
            >
            <svg className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            </a>
        </div>
        </div>

        {/* Navigation Links */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-8">
        {/* Product Column */}
        <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
            Platform
            </h3>
            <ul className="space-y-3">
            <li>
                <Link to="/discover" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors text-sm">
                Discover Tracks
                </Link>
            </li>
            <li>
                <Link to="/upload" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors text-sm">
                Upload Music
                </Link>
            </li>
            <li>
                <Link to="/collaborations" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors text-sm">
                Collaborations
                </Link>
            </li>
            <li>
                <Link to="/my-tracks" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors text-sm">
                My Tracks
                </Link>
            </li>
                <li>
                <Link to="/community" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors text-sm">
                Community
                </Link>
            </li>
            </ul>
        </div>

        {/* Resources Column */}
        <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
            Resources
            </h3>
            <ul className="space-y-3">
            <li>
                <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors text-sm">
                Documentation
                </a>
            </li>
            </ul>
        </div>
        </div>

        {/* Stats Column */}
    </div>

    {/* Bottom Bar */}
    <div className="pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-[var(--text-tertiary)] text-center md:text-left">
        © {currentYear} TrackBackAI. Final Year Project by David Afful (W1886235)
        </div>
        <div className="flex gap-8 text-sm">
        <a href="#" className="text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors">
            Privacy
        </a>
        <a href="#" className="text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors">
            Terms
        </a>
        <a href="https://www.westminster.ac.uk/" className="text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors">
            University of Westminster
        </a>
        </div>
    </div>
    </div>
</footer>
);
}

export default Footer;