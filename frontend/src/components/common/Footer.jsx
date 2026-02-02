import { Link } from 'react-router-dom';

function Footer() {
const currentYear = new Date().getFullYear();

return (
<footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-2">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">TrackBackAI</span>
        </Link>
        <p className="text-[var(--text-secondary)] mb-4 max-w-sm">
            AI-powered platform helping music producers complete their unfinished tracks through intelligent collaboration.
        </p>
        <div className="flex gap-4">
            <a
            href="https://github.com/heartz88/trackback-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 rounded-lg flex items-center justify-center transition-all border border-[var(--border-color)] hover:border-primary-500/50"
            >
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            </a>
        </div>
        </div>

        {/* Product Links */}
        <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
            Production
        </h3>
        <ul className="space-y-3">
            <li>
            <Link to="/discover" className="text-[var(--text-secondary)] hover:text-primary-400 transition-colors">
                Discover Tracks
            </Link>
            </li>
            <li>
            <Link to="/upload" className="text-[var(--text-secondary)] hover:text-primary-400 transition-colors">
                Upload Music
            </Link>
            </li>
            <li>
            <Link to="/collaborations" className="text-[var(--text-secondary)] hover:text-primary-400 transition-colors">
                Collaborations
            </Link>
            </li>
            <li>
            <Link to="/my-tracks" className="text-[var(--text-secondary)] hover:text-primary-400 transition-colors">
                My Tracks
            </Link>
            </li>
        </ul>
        </div>

        {/* Support Links
        <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
            Support
        </h3>
        <ul className="space-y-3">
            <li>
            <a href="#" className="text-[var(--text-secondary)] hover:text-primary-400 transition-colors">
                Documentation
            </a>
            </li>
            <li>
            <a href="#" className="text-[var(--text-secondary)] hover:text-primary-400 transition-colors">
                API Reference
            </a>
            </li>
            <li>
            <a href="#" className="text-[var(--text-secondary)] hover:text-primary-400 transition-colors">
                FAQ
            </a>
            </li>
            <li>
            <a href="mailto:support@trackbackai.com" className="text-[var(--text-secondary)] hover:text-primary-400 transition-colors">
                Contact
            </a>
            </li>
        </ul>
        </div>
            */}
    </div>

    {/* Bottom Bar */}
    <div className="pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-[var(--text-tertiary)]">
        © {currentYear} TrackBackAI. Final Year Project by David Afful (W1886235)
        </div>
        <div className="flex gap-6 text-sm">
        <a href="/privacy" className="text-[var(--text-tertiary)] hover:text-primary-400 transition-colors">
            Privacy
        </a>
        <a href="/terms" className="text-[var(--text-tertiary)] hover:text-primary-400 transition-colors">
            Terms
        </a>
        <a href="https://www.westminster.ac.uk/" className="text-[var(--text-tertiary)] hover:text-primary-400 transition-colors">
            University of Westminster
        </a>
        </div>
    </div>
    </div>
</footer>
);
}

export default Footer;