import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WaveformPlayer from '../components/tracks/WaveformPlayer';
import api from '../services/api';


const TABS = ['Featured', 'Recently Completed', 'Most Voted'];

const StatPill = ({ icon, label, value }) => (
<div style={{
display: 'flex', alignItems: 'center', gap: 6,
padding: '4px 10px', borderRadius: 'var(--radius-full, 999px)',
background: 'var(--surface-2, rgba(255,255,255,0.05))',
border: '1px solid var(--surface-border, rgba(255,255,255,0.08))',
fontSize: 12, color: 'var(--text-secondary)',
}}>
<span>{icon}</span>
<span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
<span>{label}</span>
</div>
);

const RankBadge = ({ rank }) => {
const medals = { 1: { emoji: '🥇', color: '#FFD700' }, 2: { emoji: '🥈', color: '#C0C0C0' }, 3: { emoji: '🥉', color: '#CD7F32' } };
const m = medals[rank];
if (!m) return (
<div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>
    #{rank}
</div>
);
return <span style={{ fontSize: 22, lineHeight: 1 }}>{m.emoji}</span>;
};

const CompletedTrackCard = ({ track, rank, featured }) => {
const [expanded, setExpanded] = useState(false);
const winner = track.winning_submission;

return (
<div
    className="animate-fade-in"
    style={{
    background: featured
        ? 'linear-gradient(135deg, var(--surface-1, rgba(255,255,255,0.04)) 0%, var(--surface-2, rgba(255,255,255,0.07)) 100%)'
        : 'var(--surface-1, rgba(255,255,255,0.03))',
    border: featured
        ? '1px solid var(--accent-primary, #7c3aed)'
        : '1px solid var(--surface-border, rgba(255,255,255,0.08))',
    borderRadius: 'var(--radius-lg, 16px)',
    padding: 0,
    overflow: 'hidden',
    transition: 'border-color 0.2s, transform 0.2s',
    position: 'relative',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
>
    {/* Featured ribbon */}
    {featured && (
    <div style={{
        background: 'var(--accent-primary, #7c3aed)',
        padding: '4px 14px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    }}>
        Featured Track
    </div>
    )}

    <div style={{ padding: '20px 24px' }}>
    {/* Header row */}
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <RankBadge rank={rank} />
        <div style={{ flex: 1, minWidth: 0 }}>
        <Link
            to={`/tracks/${track.id}`}
            style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 17, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
            {track.title}
        </Link>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            by{' '}
            <Link to={`/profile/${track.user_id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
            @{track.owner_username}
            </Link>
            {winner && (
            <>
                {' '}· completed by{' '}
                <Link to={`/profile/${winner.collaborator_id}`} style={{ color: 'var(--accent-secondary, #06b6d4)', textDecoration: 'none', fontWeight: 500 }}>
                @{winner.collaborator_name}
                </Link>
            </>
            )}
        </div>
        </div>
        {/* Vote score */}
        {winner && (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '6px 12px', borderRadius: 'var(--radius-md, 10px)',
            background: 'var(--surface-2, rgba(255,255,255,0.06))',
            border: '1px solid var(--surface-border)',
            minWidth: 56,
        }}>
            <span style={{ fontSize: 18 }}></span>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--accent-primary)', lineHeight: 1.2 }}>{winner.upvotes || 0}</span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Votes</span>
        </div>
        )}
    </div>

    {/* MIR tags */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {track.bpm && <span className="tdp-tag tdp-tag-bpm"> {Math.round(track.bpm)} BPM</span>}
        {track.musical_key && <span className="tdp-tag tdp-tag-key"> {track.musical_key}</span>}
        {track.energy_level && (
        <span className={`tdp-tag ${track.energy_level === 'high' ? 'tdp-tag-energy-high' : track.energy_level === 'medium' ? 'tdp-tag-energy-med' : 'tdp-tag-energy-low'}`}>
            ⚡ {track.energy_level}
        </span>
        )}
        {track.genre && <span className="tdp-tag tdp-tag-genre">{track.genre}</span>}
        <span style={{
        padding: '3px 10px', borderRadius: 'var(--radius-full, 999px)', fontSize: 11, fontWeight: 600,
        background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e',
        }}>
        Completed
        </span>
    </div>

    {/* Waveform toggle */}
    <button
        onClick={() => setExpanded(v => !v)}
        style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: expanded ? 12 : 0,
        }}
    >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expanded ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'} />
        </svg>
        {expanded ? 'Hide' : 'Preview original loop'}
    </button>

    {expanded && (
        <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Original Loop</div>
        <WaveformPlayer audioUrl={track.audio_url} height={56} />
        {winner?.audio_url && (
            <>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '10px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Winning Submission — v{winner.version_number || 1}
            </div>
            <WaveformPlayer audioUrl={winner.audio_url} height={56} />
            </>
        )}
        </div>
    )}

    {/* Footer actions */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatPill label="collaborators" value={track.collaborator_count || 1} />
        <StatPill label="submissions" value={track.submissions_count || 1} />
        </div>
        <Link
        to={`/tracks/${track.id}`}
        style={{
            fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
        }}
        >
        View track →
        </Link>
    </div>
    </div>
</div>
);
};

const EmptyState = ({ tab }) => (
<div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-tertiary)' }}>
<div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
<p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
    No {tab.toLowerCase()} tracks yet
</p>
<p style={{ fontSize: 14, marginBottom: 24 }}>
    Be the first to complete a collaboration and appear here!
</p>
<Link to="/discover" className="btn-primary">Find a Track to Complete</Link>
</div>
);

/* ── Main page ── */
const CommunityPage = () => {
const [activeTab, setActiveTab] = useState(0);
const [tracks, setTracks] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');
const [stats, setStats] = useState({ completed: 0, collaborators: 0, votes: 0 });

useEffect(() => {
fetchCommunityData();
}, [activeTab]);

const fetchCommunityData = async () => {
setIsLoading(true);
setError('');
try {
    // Sort strategy per tab
    const sortMap = ['featured', 'recent', 'votes'];
    const sort = sortMap[activeTab];

    // Fetch completed tracks — backend returns tracks where status = 'completed'
    const res = await api.get(`/tracks/completed?sort=${sort}&limit=20`);
    const completedTracks = res.data.tracks || [];

    // For each track, fetch its winning submission (highest voted)
    const enriched = await Promise.all(
    completedTracks.map(async (track) => {
        try {
        const subRes = await api.get(`/submissions/track/${track.id}`);
        const subs = subRes.data.submissions || [];
        const winner = subs.length > 0
            ? subs.reduce((best, s) => (parseInt(s.upvotes) || 0) > (parseInt(best.upvotes) || 0) ? s : best)
            : null;
        return {
            ...track,
            winning_submission: winner,
            submissions_count: subs.length,
        };
        } catch {
        return { ...track, winning_submission: null, submissions_count: 0 };
        }
    })
    );

    setTracks(enriched);

    // Platform stats (only load once)
    if (activeTab === 0) {
    try {
        const statsRes = await api.get('/tracks/stats/community');
        setStats(statsRes.data.stats || { completed: enriched.length, collaborators: 0, votes: 0 });
    } catch {
        // Fallback: derive from loaded data
        const totalVotes = enriched.reduce((acc, t) => acc + (parseInt(t.winning_submission?.upvotes) || 0), 0);
        setStats({ completed: enriched.length, collaborators: enriched.length, votes: totalVotes });
    }
    }
} catch (err) {
    console.error('Community fetch error:', err);
    setError('Failed to load community tracks');
} finally {
    setIsLoading(false);
}
};

return (
<div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 80px' }}>

    {/* Page header */}
    <div className="animate-slide-up" style={{ marginBottom: 32 }}>
    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
        🏆 Community Showcase
    </h1>
    <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
        Tracks that started as unfinished loops — completed by the community.
    </p>
    </div>

    {/* Platform stats bar */}
    <div
    className="animate-slide-up stagger-1"
    style={{
        display: 'flex', gap: 16, flexWrap: 'wrap',
        padding: '16px 20px',
        background: 'var(--surface-1, rgba(255,255,255,0.03))',
        border: '1px solid var(--surface-border)',
        borderRadius: 'var(--radius-lg, 16px)',
        marginBottom: 28,
    }}
    >
    {[
        { value: stats.completed, label: 'Completed Tracks' },
        { value: stats.collaborators, label: 'Collaborators' },
        { value: stats.votes, label: 'Community Votes' },
    ].map(s => (
        <div key={s.label} style={{ flex: '1 1 120px', textAlign: 'center' }}>
        <div style={{ fontSize: 22, marginBottom: 2 }}>{s.icon}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1.2 }}>{s.value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{s.label}</div>
        </div>
    ))}
    </div>

    {/* Tab bar */}
    <div
    className="animate-slide-up stagger-2"
    style={{
        display: 'flex', gap: 4,
        padding: 4,
        background: 'var(--surface-1, rgba(255,255,255,0.03))',
        border: '1px solid var(--surface-border)',
        borderRadius: 'var(--radius-lg, 14px)',
        marginBottom: 24,
    }}
    >
    {TABS.map((tab, i) => (
        <button
        key={tab}
        onClick={() => setActiveTab(i)}
        style={{
            flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md, 10px)',
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            transition: 'all 0.2s',
            background: activeTab === i ? 'var(--accent-primary, #7c3aed)' : 'transparent',
            color: activeTab === i ? '#fff' : 'var(--text-secondary)',
        }}
        >
        {tab}
        </button>
    ))}
    </div>

    {/* Content */}
    {isLoading ? (
    <div className="page-loading" style={{ padding: '64px 0' }}>
        <div className="music-loader" style={{ justifyContent: 'center' }}>
        {[...Array(5)].map((_, i) => <div key={i} className="music-loader-bar" />)}
        </div>
        <p style={{ color: 'var(--text-tertiary)', marginTop: 16 }} className="animate-pulse">Loading community tracks…</p>
    </div>
    ) : error ? (
    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)' }}>
        <p>{error}</p>
        <button onClick={fetchCommunityData} className="btn-secondary" style={{ marginTop: 12 }}>Try Again</button>
    </div>
    ) : tracks.length === 0 ? (
    <EmptyState tab={TABS[activeTab]} />
    ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

    {/* CTA for producers */}
    {!isLoading && tracks.length > 0 && (
    <div
        className="animate-slide-up"
        style={{
        marginTop: 40, padding: '28px 24px', textAlign: 'center',
        background: 'linear-gradient(135deg, var(--surface-1) 0%, var(--surface-2) 100%)',
        border: '1px solid var(--surface-border)',
        borderRadius: 'var(--radius-lg, 16px)',
        }}
    >
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
        Want your track to appear here?
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Upload your unfinished loop, find a collaborator, and let the community vote.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/upload" className="btn-primary">Upload a Loop</Link>
        <Link to="/discover" className="btn-secondary">Find a Track to Complete</Link>
        </div>
    </div>
    )}
</div>
);
};

export default CommunityPage;