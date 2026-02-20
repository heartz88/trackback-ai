import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SubmissionList from '../components/submissions/SubmissionList';
import WaveformPlayer from '../components/tracks/WaveformPlayer';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TrackDetailPage = () => {
const { trackId } = useParams();
const { user } = useAuth();
const navigate = useNavigate();
const [track, setTrack] = useState(null);
const [owner, setOwner] = useState(null);
const [collaboration, setCollaboration] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');
const [requestingCollab, setRequestingCollab] = useState(false);
const [collaborators, setCollaborators] = useState([]);
const [submissionsCount, setSubmissionsCount] = useState(0);
const [collabMessage, setCollabMessage] = useState('');
const [showMessageInput, setShowMessageInput] = useState(false);
const [isPlaying, setIsPlaying] = useState(false);

useEffect(() => { fetchTrackDetails(); }, [trackId]);

const fetchTrackDetails = async () => {
setIsLoading(true);
setError('');
try {
    const trackResponse = await api.get(`/tracks/${trackId}`);
    setTrack(trackResponse.data.track);
    const ownerResponse = await api.get(`/users/${trackResponse.data.track.user_id}`);
    setOwner(ownerResponse.data.user);
    try {
    const r = await api.get(`/submissions/track/${trackId}`);
    setSubmissionsCount(r.data.submissions?.length || 0);
    } catch { setSubmissionsCount(0); }
    try {
    const r = await api.get(`/collaborations/track/${trackId}/active`);
    setCollaborators(r.data.collaborators || []);
    } catch { setCollaborators([]); }
    if (user) {
    try {
        const r = await api.get(`/collaborations/track/${trackId}`);
        setCollaboration(r.data.collaboration);
    } catch { setCollaboration(null); }
    }
} catch (err) {
    console.error('Error fetching track:', err);
    setError('Failed to load track');
} finally {
    setIsLoading(false);
}
};

const handleRequestCollaboration = async () => {
if (!user) { navigate('/login'); return; }
if (!showMessageInput) { setShowMessageInput(true); return; }
setRequestingCollab(true);
try {
    const response = await api.post('/collaborations/request', {
    track_id: trackId,
    message: collabMessage || `I'd like to collaborate on "${track.title}"`,
    });
    setCollaboration(response.data.request);
    setShowMessageInput(false);
    alert('Collaboration request sent!');
} catch (error) {
    alert(error.response?.data?.error?.message || 'Failed to send collaboration request');
} finally {
    setRequestingCollab(false);
}
};

const handleCompleteTrack = async () => {
if (!window.confirm('Mark this track as completed? The highest voted submission will be selected as the final version.')) return;
try {
    await api.post(`/collaborations/${trackId}/complete`);
    alert('Track marked as completed!');
    fetchTrackDetails();
} catch (err) {
    alert(err.response?.data?.error?.message || 'Failed to complete track');
}
};

const handlePlay = useCallback(() => setIsPlaying(true), []);
const handlePause = useCallback(() => setIsPlaying(false), []);

const isOwner = user && track && user.id === track.user_id;
const canRequestCollab = user && !isOwner && !collaboration;
const hasApprovedCollab = collaboration?.status === 'approved';

if (isLoading) {
return (
    <div className="page-loading">
    <div className="music-loader">
        {[...Array(5)].map((_, i) => <div key={i} className="music-loader-bar" />)}
    </div>
    <p className="mt-4 text-secondary animate-pulse">Loading track...</p>
    </div>
);
}

if (error || !track) {
return (
    <div className="page-error animate-fade-in">
    <h2>Track Not Found</h2>
    <p>{error || 'This track does not exist'}</p>
    <Link to="/discover" className="btn-primary">Browse Tracks</Link>
    </div>
);
}

return (
<div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>

    {/* Breadcrumb */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
    <Link to="/discover" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
        onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'}
        onMouseLeave={e => e.target.style.color = 'var(--text-tertiary)'}
    >Discover</Link>
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
    <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</span>
    </div>

    {/* ── FULL WIDTH PLAYER ── */}
    <div style={{ marginBottom: 24 }}>
    <WaveformPlayer
        audioUrl={track.audio_url}
        height={80}
        onPlay={handlePlay}
        onPause={handlePause}
    />
    </div>

    {/* ── MAIN CONTENT GRID: info left, actions right ── */}
    <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 20,
    alignItems: 'start',
    marginBottom: 20,
    }}>

    {/* LEFT — Track info */}
    <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '28px 28px 24px',
    }}>
        {/* Title + playing indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {track.title}
        </h1>
        {isPlaying && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 20, flexShrink: 0 }}>
            {[1, 1.6, 1.2, 1.8, 1.4].map((h, i) => (
                <div key={i} style={{
                width: 3,
                height: `${h * 8}px`,
                background: 'var(--accent-primary, #14B8A6)',
                borderRadius: 2,
                animation: `equalizerBar ${0.6 + i * 0.1}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.1}s`,
                }} />
            ))}
            </div>
        )}
        </div>

        {/* Owner row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to={`/profile/${owner?.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div className="avatar bpm-badge" style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>
            {owner?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>@{owner?.username}</div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{new Date(track.created_at).toLocaleDateString()}</div>
            </div>
        </Link>
        {user && !isOwner && (
            <Link
            to={`/messages/new?userId=${owner?.id}`}
            style={{
                marginLeft: 'auto',
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)', fontSize: 12,
                textDecoration: 'none', transition: 'all 0.2s',
            }}
            >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Message
            </Link>
        )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        {[
            { label: 'Plays', value: track.plays || 0 },
            { label: 'Submissions', value: submissionsCount },
            { label: 'Collaborators', value: collaborators.length },
        ].map((stat, i) => (
            <div key={stat.label} style={{
            flex: 1,
            padding: '14px 0',
            textAlign: 'center',
            borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            background: 'rgba(255,255,255,0.02)',
            }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{stat.label}</div>
            </div>
        ))}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: track.description ? 20 : 0 }}>
        {track.bpm && (
            <span className="chip bpm-badge">🎵 {Math.round(track.bpm)} BPM</span>
        )}
        {track.musical_key && (
            <span className="chip genre-tag">🎹 {track.musical_key}</span>
        )}
        {track.energy_level && (
            <span className="chip" style={{
            background: track.energy_level === 'high' ? 'rgba(239,68,68,0.15)' : track.energy_level === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
            borderColor: track.energy_level === 'high' ? '#ef4444' : track.energy_level === 'medium' ? '#f59e0b' : '#10b981',
            border: '1px solid',
            }}>⚡ {track.energy_level}</span>
        )}
        {track.genre && (
            <span className="chip genre-tag">🎸 {track.genre}</span>
        )}
        </div>

        {/* Description */}
        {track.description && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>About</div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{track.description}</p>
        </div>
        )}

        {/* Desired skills */}
        {track.desired_skills && track.desired_skills.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>🎯 Looking For</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {track.desired_skills.map((skill, i) => (
                <span key={i} className="skill-tag">{skill}</span>
            ))}
            </div>
        </div>
        )}
    </div>

    {/* RIGHT — Actions panel */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Collab actions card */}
        <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Collaborate</div>

        {!user && (
            <Link to="/login" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>Login to Collaborate</Link>
        )}

        {canRequestCollab && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {showMessageInput && (
                <textarea
                value={collabMessage}
                onChange={(e) => setCollabMessage(e.target.value)}
                placeholder={`Tell ${owner?.username} why you'd like to collaborate...`}
                style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, color: 'var(--text-primary)',
                    fontSize: 13, resize: 'none', outline: 'none',
                }}
                rows={3}
                />
            )}
            <button onClick={handleRequestCollaboration} className="btn-primary" disabled={requestingCollab}>
                {requestingCollab ? 'Sending...' : showMessageInput ? '🤝 Send Request' : '🤝 Request Collaboration'}
            </button>
            {showMessageInput && (
                <button onClick={() => setShowMessageInput(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer' }}>
                Cancel
                </button>
            )}
            </div>
        )}

        {collaboration && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {collaboration.status === 'pending' && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: 13, textAlign: 'center' }}>
                ⏳ Request Pending
                </div>
            )}
            {collaboration.status === 'approved' && (
                <>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: 13, textAlign: 'center' }}>
                    ✅ Collaboration Approved
                </div>
                <Link to={`/tracks/${trackId}/submissions`} className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
                    ➕ Submit Your Version
                </Link>
                </>
            )}
            {collaboration.status === 'rejected' && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 13, textAlign: 'center' }}>
                ❌ Collaboration Declined
                </div>
            )}
            </div>
        )}

        {isOwner && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/my-tracks" className="btn-secondary glass" style={{ textAlign: 'center', textDecoration: 'none' }}>✏️ Manage My Tracks</Link>
            {submissionsCount > 0 && (
                <>
                <Link to={`/tracks/${trackId}/submissions`} className="btn-secondary glass" style={{ textAlign: 'center', textDecoration: 'none' }}>
                    📋 View Submissions ({submissionsCount})
                </Link>
                <button onClick={handleCompleteTrack} className="btn-secondary glass">✅ Mark as Completed</button>
                </>
            )}
            </div>
        )}

        {hasApprovedCollab && track.audio_url && (
            <a href={track.audio_url} download target="_blank" rel="noreferrer" className="btn-secondary glass"
            style={{ textAlign: 'center', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', textDecoration: 'none' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Track
            </a>
        )}
        </div>

        {/* Collaborators card */}
        {collaborators.length > 0 && (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 20,
        }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>🤝 Collaborators</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {collaborators.map((collab) => (
                <div key={collab.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link to={`/profile/${collab.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, textDecoration: 'none' }}>
                    <div className="collaborator-avatar" style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    {collab.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>@{collab.username}</div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{collab.role || 'Collaborator'}</div>
                    </div>
                </Link>
                {user && user.id !== collab.id && (
                    <Link to={`/messages/new?userId=${collab.id}`}
                    style={{ fontSize: 11, color: 'var(--text-tertiary)', textDecoration: 'none', padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                    Msg
                    </Link>
                )}
                </div>
            ))}
            </div>
        </div>
        )}
    </div>
    </div>

    {/* ── SUBMISSIONS ── */}
    <div style={{
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '24px 28px',
    }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>🏆 Submissions</h2>
        {submissionsCount > 0 && (
        <Link to={`/tracks/${trackId}/submissions`} className="btn-view-all">
            View All ({submissionsCount}) →
        </Link>
        )}
    </div>
    <SubmissionList trackId={trackId} limit={3} />
    {submissionsCount === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
        No submissions yet.{' '}
        {hasApprovedCollab && (
            <Link to={`/tracks/${trackId}/submissions`} style={{ color: 'var(--accent-primary)' }}>Be the first to submit!</Link>
        )}
        </div>
    )}
    </div>

    {/* Equalizer bar keyframe */}
    <style>{`
    @keyframes equalizerBar {
        from { transform: scaleY(0.4); }
        to { transform: scaleY(1); }
    }
    `}</style>
</div>
);
};

export default TrackDetailPage;