import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import CommunityStats from '../components/community/CommunityStats';
import CommunityTabs from '../components/community/CommunityTabs';
import CompletedTrackCard from '../components/community/CompletedTrackCard';
import EmptyCommunityState from '../components/community/EmptyCommunityState';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

import librosaLogo from '../assets/librosa-logo.png';
import nodejsLogo from '../assets/nodejs-logo.png';
import postgresqlLogo from '../assets/postgresql-logo.png';
import pythonLogo from '../assets/python-logo.png';
import reactLogo from '../assets/react-logo.png';

// ─── Logged-in view: Community feed ──────────────────────────────────────────
function CommunityFeed() {
const [activeTab, setActiveTab] = useState(0);
const [tracks, setTracks] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');
const [stats, setStats] = useState({ completed: 0, collaborators: 0, votes: 0 });
const [animating, setAnimating] = useState(false);
const prevTab = useRef(0);
const hasFetched = useRef(false);
const { on } = useSocket();

useEffect(() => {
fetchCommunityData(!hasFetched.current);
hasFetched.current = true;
}, [activeTab]);

useEffect(() => {
const unsub = on('track:completed', () => {
    if (activeTab === 0 || activeTab === 1) fetchCommunityData();
    setStats(prev => ({ ...prev, completed: prev.completed + 1 }));
});
return unsub;
}, [on, activeTab]);

const fetchCommunityData = async (showLoader = false) => {
if (showLoader) setIsLoading(true);
setError('');
try {
    const sortMap = ['featured', 'recent', 'votes'];
    const res = await api.get('/tracks/completed?sort=' + sortMap[activeTab] + '&limit=20');
    const completedTracks = res.data.tracks || [];

    const enriched = await Promise.all(
    completedTracks.map(async (track) => {
        try {
        const subRes = await api.get('/submissions/track/' + track.id);
        const subs = subRes.data.submissions || [];
        const winner = subs.length > 0
            ? subs.reduce((best, s) =>
                (parseInt(s.upvotes) || 0) > (parseInt(best.upvotes) || 0) ? s : best)
            : null;
        return {
            ...track,
            winning_submission: winner
            ? { ...winner, upvotes: parseInt(winner.upvotes) || 0 }
            : null,
            submissions_count: subs.length,
        };
        } catch {
        return { ...track, winning_submission: null, submissions_count: 0 };
        }
    })
    );

    setTracks(enriched);

    if (activeTab === 0) {
    try {
        const statsRes = await api.get('/tracks/stats/community');
        setStats(statsRes.data.stats || {
        completed: enriched.length,
        collaborators: 0,
        votes: 0,
        });
    } catch {
        const totalVotes = enriched.reduce(
        (acc, t) => acc + (parseInt(t.winning_submission?.upvotes) || 0), 0
        );
        setStats({
        completed: enriched.length,
        collaborators: enriched.length,
        votes: totalVotes,
        });
    }
    }
} catch (err) {
    console.error('Community fetch error:', err);
    setError('Failed to load community tracks');
} finally {
    setIsLoading(false);
}
};

const handleTabChange = (i) => {
if (i === activeTab) return;
setAnimating(true);
setTimeout(() => {
    prevTab.current = activeTab;
    setActiveTab(i);
    setAnimating(false);
}, 180);
};

const slideDir = activeTab > prevTab.current ? 1 : -1;

if (isLoading) {
return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="music-loader">
        {[...Array(5)].map((_, i) => <div key={i} className="music-loader-bar" />)}
    </div>
    </div>
);
}

if (error) {
return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => fetchCommunityData(true)} className="btn-primary">
        Try Again
        </button>
    </div>
    </div>
);
}

return (
<div className="max-w-5xl mx-auto px-4 py-8">
    {/* Header */}
    <div className="mb-8">
    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
        Community Showcase
    </h1>
    <p className="text-[var(--text-secondary)]">
        Tracks that started as unfinished loops — completed by the community.
    </p>
    </div>

    <CommunityStats stats={stats} />
    <CommunityTabs activeTab={activeTab} setActiveTab={handleTabChange} />

    <div
    style={{
        transition: 'opacity 0.18s ease, transform 0.18s ease',
        opacity: animating ? 0 : 1,
        transform: animating ? `translateX(${slideDir * 24}px)` : 'translateX(0)',
    }}
    >
    {tracks.length === 0 ? (
        <EmptyCommunityState
        tab={['Featured', 'Recently Completed', 'Most Voted'][activeTab]}
        />
    ) : (
        <div className="space-y-4">
        {tracks.map((track, i) => (
            <CompletedTrackCard
            key={track.id}
            track={track}
            rank={i + 1}
            featured={activeTab === 0 && i === 0}
            />
        ))}
        </div>
    )}
    </div>

    {/* CTA */}
    <div className="mt-12 p-8 bg-gradient-to-br from-primary-500/5 to-primary-600/5 rounded-2xl border border-primary-500/20 text-center">
    <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        Want your track to appear here?
    </p>
    <p className="text-[var(--text-secondary)] mb-4">
        Upload your unfinished loop, find a collaborator, and let the community vote.
    </p>
    <div className="flex gap-4 justify-center">
        <Link to="/upload" className="btn-primary">Upload a Loop</Link>
        <Link to="/discover" className="btn-secondary">Find a Track to Complete</Link>
    </div>
    </div>
</div>
);
}

// ─── Logged-out view: Marketing landing page ──────────────────────────────────
function MarketingPage() {
return (
<div className="min-h-screen bg-[var(--bg-primary)]">
    {/* Hero */}
    <section className="relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-primary-600/5" />
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
        <div className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full mb-8">
            <span className="text-sm font-medium text-primary-400">AI-Powered Music Collaboration</span>
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
            Turn Your Loops Into
            <br />
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            Finished Tracks
            </span>
        </h1>
        <p className="text-xl lg:text-2xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with producers who have the skills you need to complete your unfinished music
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
            to="/register"
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-lg font-semibold rounded-xl shadow-lg shadow-primary-500/25"
            >
            Get Started Free
            </Link>
            <Link
            to="/discover"
            className="px-8 py-4 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-lg font-semibold rounded-xl border border-[var(--border-color)]"
            >
            Explore Tracks
            </Link>
        </div>
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-[var(--border-color)]">
            <div>
            <div className="text-3xl font-bold text-primary-400 mb-1">84%</div>
            <div className="text-sm text-[var(--text-tertiary)]">BPM Accuracy</div>
            </div>
            <div>
            <div className="text-3xl font-bold text-primary-400 mb-1">Real-time</div>
            <div className="text-sm text-[var(--text-tertiary)]">Analysis</div>
            </div>
            <div>
            <div className="text-3xl font-bold text-primary-400 mb-1">Free</div>
            <div className="text-sm text-[var(--text-tertiary)]">To Start</div>
            </div>
        </div>
        </div>
    </div>
    </section>

    {/* How it works */}
    <section className="py-24 bg-[var(--bg-secondary)]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">How It Works</h2>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Simple workflow to transform your unfinished ideas into complete tracks
        </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
        {[
            {
            icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
            title: 'Upload Your Loop',
            desc: 'Upload your unfinished track in MP3, WAV, or FLAC format',
            },
            {
            icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
            title: 'AI Analysis',
            desc: 'Our AI extracts BPM, energy level, and musical characteristics',
            },
            {
            icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            title: 'Find Collaborators',
            desc: 'Connect with producers who have the skills to complete your track',
            },
        ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center relative">
            <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mb-6 border border-primary-500/20">
                <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                </svg>
            </div>
            {i < 2 && (
                <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent hidden md:block" />
            )}
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{step.title}</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
            </div>
        ))}
        </div>
    </div>
    </section>

    {/* Features */}
    <section className="py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">Powerful Features</h2>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Everything you need to collaborate and complete your music
        </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
            { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Instant Analysis', desc: 'Automated BPM detection and energy level classification using advanced MIR technology' },
            { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', title: 'Smart Discovery', desc: 'Filter tracks by BPM range, genre, and energy level to find perfect matches' },
            { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', title: 'Real-time Messaging', desc: 'Chat with collaborators instantly using WebSocket-powered messaging' },
            { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Version Control', desc: 'Submit multiple versions and let the community vote on the best one' },
            { icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122', title: 'Waveform Preview', desc: 'Visual audio playback with synchronized waveform display' },
            { icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', title: 'Advanced Filtering', desc: 'Find exactly what you need with precise BPM, genre, and energy filters' },
        ].map((f, i) => (
            <div key={i} className="p-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] hover:border-primary-500/50 transition-colors">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{f.title}</h3>
            <p className="text-[var(--text-secondary)] text-sm">{f.desc}</p>
            </div>
        ))}
        </div>
    </div>
    </section>

    {/* Tech stack */}
    <section className="py-24 bg-[var(--bg-secondary)]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
            Built With Modern Technology
        </h2>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Powered by industry-leading tools and frameworks
        </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
            { logo: reactLogo, name: 'React', role: 'Frontend' },
            { logo: nodejsLogo, name: 'Node.js', role: 'Backend' },
            { logo: postgresqlLogo, name: 'PostgreSQL', role: 'Database' },
        ].map((t, i) => (
            <div key={i} className="flex flex-col items-center p-6 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
            <img src={t.logo} alt={t.name} className="w-16 h-16 mb-3 object-contain" />
            <h4 className="font-semibold text-[var(--text-primary)]">{t.name}</h4>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{t.role}</p>
            </div>
        ))}
        <div className="flex flex-col items-center p-6 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
            <div className="flex items-center justify-center gap-3 mb-3">
            <img src={pythonLogo} alt="Python" className="w-10 h-10 object-contain" />
            <span className="text-[var(--text-tertiary)] text-xl">+</span>
            <img src={librosaLogo} alt="Librosa" className="w-10 h-10 object-contain" />
            </div>
            <h4 className="font-semibold text-[var(--text-primary)]">Python + Librosa</h4>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">ML / Audio Analysis</p>
        </div>
        </div>
    </div>
    </section>

    {/* Final CTA */}
    <section className="py-24">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-br from-primary-500/10 to-primary-600/10 rounded-3xl p-12 border border-primary-500/20">
        <h2 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
            Ready to Complete Your Tracks?
        </h2>
        <p className="text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
            Join TrackBackAI and start collaborating with talented producers today
        </p>
        <Link
            to="/register"
            className="inline-block px-10 py-5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-lg font-semibold rounded-xl shadow-lg shadow-primary-500/25"
        >
            Get Started Free →
        </Link>
        </div>
    </div>
    </section>
</div>
);
}

// ─── Root: switches based on auth state ──────────────────────────────────────
function HomePage() {
const { user } = useAuth();
return user ? <CommunityFeed /> : <MarketingPage />;
}

export default HomePage;