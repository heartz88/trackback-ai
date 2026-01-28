import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FeatureShowcase from '../components/common/FeatureShowcase';
import VisualizerBars from '../components/home/VisualizerBars';
import { useAuth } from '../context/AuthContext';

function HomePage() {
const { user } = useAuth();
const [isPlaying, setIsPlaying] = useState(false);

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }) => {
const [count, setCount] = useState(0);

useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
    if (!startTime) startTime = currentTime;
    const progress = (currentTime - startTime) / duration;

    if (progress < 1) {
        setCount(Math.floor(end * progress));
        requestAnimationFrame(animate);
    } else {
        setCount(end);
    }
    };
    requestAnimationFrame(animate);
}, [end, duration]);

return <span>{count.toLocaleString()}{suffix}</span>;
};

return (
<div className="min-h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[#0f766e] to-[var(--bg-primary)] relative overflow-hidden transition-colors duration-300">
    {/* Animated Background Grid */}
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>

    {/* Floating Particles */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
        <div
        key={i}
        className="particle"
        style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${8 + Math.random() * 4}s`,
        }}
        />
    ))}
    </div>

    {/* Main Content */}
    <div className="relative max-w-7xl mx-auto px-4 py-20">
    {/* Hero Section */}
    <div className="text-center mb-20">
        <div className="inline-block mb-8 relative">
        <div
            className={`p-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl shadow-2xl shadow-primary-500/50 ${isPlaying ? 'animate-pulse-glow' : ''
            }`}
            onMouseEnter={() => setIsPlaying(true)}
            onMouseLeave={() => setIsPlaying(false)}
        >
            <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
        </div>
        <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 border-2 border-primary-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute inset-0 border-2 border-primary-400/20 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        </div>
        </div>

        <VisualizerBars isPlaying={isPlaying} />

        <h1 className="text-6xl md:text-8xl font-extrabold text-[var(--text-primary)] mb-6 leading-tight">
        Finish What You
        <br />
        <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-primary-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            Started
        </span>
        </h1>

        <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto leading-relaxed">
        AI-powered Music Information Retrieval finds the{' '}
        <span className="text-primary-400 font-bold">perfect collaborator</span> to complete your unfinished tracks
        </p>

        {!user && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
            to="/register"
            className="group relative px-10 py-5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-lg font-bold rounded-full transition-all shadow-2xl shadow-primary-500/50 hover:shadow-primary-500/70 hover:scale-105"
            >
            <span className="relative z-10">Start Creating Free</span>
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
            </Link>
            <Link
            to="/login"
            className="px-10 py-5 bg-[var(--bg-tertiary)] hover:opacity-80 text-[var(--text-primary)] text-lg font-bold rounded-full transition-all border-2 border-[var(--border-color)] hover:border-primary-500"
            >
            Sign In
            </Link>
        </div>
        )}

        <div className="flex justify-center gap-8">
        <div className="glass-panel p-6 rounded-2xl hover:border-primary-500/50 transition-all">
            <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text mb-2">
            <AnimatedCounter end={98} suffix="%" />
            </div>
            <div className="text-[var(--text-tertiary)] text-sm font-medium">BPM Match Accuracy</div>
        </div>
        </div>
    </div>

    {/* How It Works */}
    <div className="mb-24">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-[var(--text-primary)] mb-4">
        How It <span className="text-primary-400">Works</span>
        </h2>
        <p className="text-center text-[var(--text-tertiary)] mb-16 text-lg">Three simple steps to complete your music</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="group relative glass-panel p-8 rounded-2xl hover:border-primary-500/50 transition-all music-card">
        <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3 text-center">Upload Your Loop</h3>
            <p className="text-[var(--text-secondary)] text-center leading-relaxed">
            Drop your unfinished track. Our AI analyzes BPM, key, energy, and musical characteristics instantly.
            </p>
            <div className="mt-6 flex justify-center gap-2">
            <span className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-300">MP3</span>
            <span className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-300">WAV</span>
            <span className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-300">FLAC</span>
            </div>
        </div>

        <div className="group relative glass-panel p-8 rounded-2xl hover:border-primary-500/50 transition-all music-card">
            <div className="w-16 h-16 bg-primary-400/20 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3 text-center">AI Matches You</h3>
            <p className="text-[var(--text-secondary)] text-center leading-relaxed">
            Our MIR algorithm finds producers with complementary skills, style, and availability to complete your vision.
            </p>
            <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                <span>BPM Matching</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <span>Energy Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span>Skill Compatibility</span>
            </div>
            </div>
        </div>

        <div className="group relative glass-panel p-8 rounded-2xl hover:border-primary-500/50 transition-all music-card">
            <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3 text-center">Complete & Release</h3>
            <p className="text-[var(--text-secondary)] text-center leading-relaxed">
            Collaborate seamlessly, vote on versions, and finalize your track. No more "Loop Land" limbo.
            </p>
            <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600/20 to-primary-500/20 border border-primary-500/30 rounded-full">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-primary-300 font-medium">Track Completed!</span>
            </div>
            </div>
        </div>
        </div>
    </div>

    {/* Features Section - Interactive Tabs */}
    <div className="mb-24">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-[var(--text-primary)] mb-4">
        Powered by <span className="text-primary-400">Advanced AI</span>
        </h2>
        <p className="text-center text-[var(--text-tertiary)] mb-12 text-lg">Click to explore each feature</p>

        <FeatureShowcase />
    </div>

    {/* Final CTA */}
    {!user && (
        <div className="text-center bg-gradient-to-r from-primary-900/20 to-primary-800/20 backdrop-blur-xl p-12 rounded-3xl border border-primary-500/30">
        <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
            Ready to Complete Your Music?
        </h2>
        <p className="text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
            Join other producers on finishing their tracks with AI-powered collaboration
        </p>
        <Link
            to="/register"
            className="inline-block px-12 py-5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-xl font-bold rounded-full transition-all shadow-2xl shadow-primary-500/50 hover:shadow-primary-500/70 hover:scale-105"
        >
            Start For Free →
        </Link>
        </div>
    )}
    </div>
</div>
);
}

export default HomePage;