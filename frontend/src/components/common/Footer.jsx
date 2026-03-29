import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

function Footer() {
const currentYear = new Date().getFullYear();

return (
<footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

    {/* Main grid — stacks on mobile, side-by-side on lg */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 sm:mb-12">

      {/* Brand */}
    <div className="lg:col-span-5 space-y-4">
        <Link to="/" className="inline-flex items-center gap-3">
        <img src={logo} className="w-10 h-10 object-cover rounded-xl" alt="TrackBack AI" />
        <span className="text-xl font-bold tracking-tight">
            <span className="text-[var(--text-primary)]">Track</span>
            <span className="text-[var(--accent-primary)]">Back</span>
            <span className="text-[var(--text-secondary)]">AI</span>
        </span>
        </Link>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm">
        AI-powered platform helping music producers complete their unfinished tracks through intelligent collaboration and creative matching.
        </p>

        {/* GitHub */}
        <a
        href="https://github.com/heartz88/trackback-ai"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)] text-sm text-[var(--text-secondary)]"
    >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
        View on GitHub
    </a>
    </div>

      {/* Nav links — 2-col grid, full width on mobile, right-aligned on lg */}
    <div className="lg:col-span-4 grid grid-cols-2 gap-6 sm:gap-8">
    <div>
        <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3">
        Platform
        </h3>
        <ul className="space-y-2.5">
        {[
            { to: '/discover',       label: 'Discover Tracks' },
            { to: '/upload',         label: 'Upload Music' },
            { to: '/collaborations', label: 'Collaborations' },
            { to: '/my-tracks',      label: 'My Tracks' },
            { to: '/community',      label: 'Community' },
        ].map(({ to, label }) => (
            <li key={to}>
            <Link to={to} className="text-sm text-[var(--text-secondary)]">
                {label}
            </Link>
            </li>
        ))}
        </ul>
        </div>

        <div>
        <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3">
        Resources
        </h3>
        <ul className="space-y-2.5">
        <li>
            <a href="#" className="text-sm text-[var(--text-secondary)]">
            Documentation
            </a>
        </li>
        </ul>
    </div>
    </div>
    </div>

    {/* Bottom bar — stacks on mobile */}
    <div className="pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[var(--text-tertiary)]">
    <p className="text-center sm:text-left">
    © {currentYear} TrackBackAI · Final Year Project by David Afful (W1886235)
    </p>
    <div className="flex flex-wrap justify-center gap-5">
    <a href="#">Privacy</a>
    <a href="#">Terms</a>
    <a href="https://www.westminster.ac.uk/" target="_blank" rel="noopener noreferrer">
        University of Westminster
    </a>
    </div>
</div>

</div>
</footer>
);
}

export default Footer;