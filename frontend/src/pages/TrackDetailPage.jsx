import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CommentSection from '../components/comments/CommentSection';
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

useEffect(() => {
fetchTrackDetails();
}, [trackId]);

const fetchTrackDetails = async () => {
setIsLoading(true);
setError('');
try {
    const trackResponse = await api.get(`/tracks/${trackId}`);
    setTrack(trackResponse.data.track);

    const ownerResponse = await api.get(`/users/${trackResponse.data.track.user_id}`);
    setOwner(ownerResponse.data.user);

    try {
    const submissionsResponse = await api.get(`/submissions/track/${trackId}`);
    setSubmissionsCount(submissionsResponse.data.submissions?.length || 0);
    } catch {
    setSubmissionsCount(0);
    }

    try {
    const collabResponse = await api.get(`/collaborations/track/${trackId}/active`);
    setCollaborators(collabResponse.data.collaborators || []);
    } catch {
    setCollaborators([]);
    }

    if (user) {
    try {
        const collabResponse = await api.get(`/collaborations/track/${trackId}`);
        setCollaboration(collabResponse.data.collaboration);
    } catch {
        setCollaboration(null);
    }
    }
} catch (error) {
    console.error('Error fetching track:', error);
    setError('Failed to load track');
} finally {
    setIsLoading(false);
}
};

const handleRequestCollaboration = async () => {
if (!user) {
    navigate('/login');
    return;
}
if (!showMessageInput) {
    setShowMessageInput(true);
    return;
}
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

const isOwner = user && track && user.id === track.user_id;
const canRequestCollab = user && !isOwner && !collaboration;
const hasApprovedCollab = collaboration?.status === 'approved';

if (isLoading) {
return (
    <div className="page-loading">
    <div className="music-loader">
        <div className="music-loader-bar"></div>
        <div className="music-loader-bar"></div>
        <div className="music-loader-bar"></div>
        <div className="music-loader-bar"></div>
        <div className="music-loader-bar"></div>
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
<div className="track-detail-page animate-fade-in">
    {/* Breadcrumb */}
    <div className="px-4 pt-4 max-w-7xl mx-auto">
    <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mb-4">
        <Link to="/discover" className="hover:text-primary-400 transition-colors">Discover</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[var(--text-secondary)] truncate">{track.title}</span>
    </div>
    </div>

    {/* Hero Section */}
    <div className="track-hero glass-strong">
    <div className="hero-content">
        <div className="waveform-container glass">
        <WaveformPlayer audioUrl={track.audio_url} height={200} />
        </div>

        <div className="track-meta">
        <h1 className="animate-slide-up">{track.title}</h1>

        {/* Owner */}
        <div className="owner-info animate-slide-up stagger-1">
            <Link to={`/profile/${owner?.id}`} className="flex items-center gap-3 group">
            <div className="avatar bpm-badge group-hover:scale-105 transition-transform">
                {owner?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
                <span className="owner-link">@{owner?.username}</span>
                <span className="upload-date"> · {new Date(track.created_at).toLocaleDateString()}</span>
            </div>
            </Link>
            {/* Message owner (if not own track and logged in) */}
            {user && !isOwner && (
            <Link
                to={`/messages/new?userId=${owner?.id}`}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-lg text-xs transition-all border border-[var(--border-color)]"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message
            </Link>
            )}
        </div>

        {/* Track Stats */}
        <div className="track-stats animate-slide-up stagger-2">
            <div className="stat-item">
            <span className="stat-label">Plays</span>
            <span className="stat-value">{track.plays || 0}</span>
            </div>
            <div className="stat-item">
            <span className="stat-label">Submissions</span>
            <span className="stat-value">{submissionsCount}</span>
            </div>
            <div className="stat-item">
            <span className="stat-label">Collaborators</span>
            <span className="stat-value">{collaborators.length}</span>
            </div>
        </div>

        {/* MIR Tags */}
        <div className="music-chips animate-slide-up stagger-3">
            {track.bpm && <span className="chip bpm-badge">🎵 {Math.round(track.bpm)} BPM</span>}
            {track.musical_key && <span className="chip genre-tag">🎹 {track.musical_key}</span>}
            {track.energy_level && (
            <span
                className="chip"
                style={{
                background:
                    track.energy_level === 'high'
                    ? 'rgba(239,68,68,0.2)'
                    : track.energy_level === 'medium'
                    ? 'rgba(245,158,11,0.2)'
                    : 'rgba(16,185,129,0.2)',
                borderColor:
                    track.energy_level === 'high' ? '#ef4444' : track.energy_level === 'medium' ? '#f59e0b' : '#10b981',
                }}
            >
                ⚡ {track.energy_level}
            </span>
            )}
            {track.genre && <span className="chip genre-tag">🎸 {track.genre}</span>}
        </div>
        </div>
    </div>

    {/* Actions */}
    <div className="track-actions animate-slide-up stagger-4">
        {/* Not logged in */}
        {!user && (
        <Link to="/login" className="btn-primary">
            Login to Collaborate
        </Link>
        )}

        {/* Request collaboration */}
        {canRequestCollab && (
        <div className="flex flex-col gap-2 w-full">
            {showMessageInput && (
            <textarea
                value={collabMessage}
                onChange={(e) => setCollabMessage(e.target.value)}
                placeholder={`Tell ${owner?.username} why you'd like to collaborate...`}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
            />
            )}
            <button
            onClick={handleRequestCollaboration}
            className="btn-primary"
            disabled={requestingCollab}
            >
            {requestingCollab ? (
                <>
                <span className="music-loader-small"></span>
                Sending...
                </>
            ) : showMessageInput ? (
                '🤝 Send Request'
            ) : (
                '🤝 Request Collaboration'
            )}
            </button>
            {showMessageInput && (
            <button onClick={() => setShowMessageInput(false)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                Cancel
            </button>
            )}
        </div>
        )}

        {/* Collaboration status */}
        {collaboration && (
        <div className="collab-status w-full">
            {collaboration.status === 'pending' && (
            <span className="status-badge pending glass w-full text-center">⏳ Collaboration Request Pending</span>
            )}
            {collaboration.status === 'approved' && (
            <div className="flex flex-col gap-2 w-full">
                <span className="status-badge approved glass w-full text-center">✅ Collaboration Approved</span>
                <Link to={`/tracks/${trackId}/submissions`} className="btn-primary text-center">
                ➕ Submit Your Version
                </Link>
            </div>
            )}
            {collaboration.status === 'rejected' && (
            <span className="status-badge rejected glass w-full text-center">❌ Collaboration Declined</span>
            )}
        </div>
        )}

        {/* Owner actions */}
        {isOwner && (
        <div className="flex flex-col gap-2 w-full">
            <Link to="/my-tracks" className="btn-secondary glass text-center">
            ✏️ Manage My Tracks
            </Link>
            {submissionsCount > 0 && (
            <>
                <Link to={`/tracks/${trackId}/submissions`} className="btn-secondary glass text-center">
                📋 View All Submissions ({submissionsCount})
                </Link>
                <button onClick={handleCompleteTrack} className="btn-secondary glass">
                ✅ Mark as Completed
                </button>
            </>
            )}
        </div>
        )}

        {/* Download track link for approved collaborators */}
        {hasApprovedCollab && track.audio_url && (
        <a
            href={track.audio_url}
            download
            target="_blank"
            rel="noreferrer"
            className="btn-secondary glass text-center flex items-center gap-2 justify-center"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Track
        </a>
        )}
    </div>
    </div>

    {/* Description */}
    {track.description && (
    <div className="description-section glass animate-slide-up stagger-5">
        <h2>📋 Description</h2>
        <p>{track.description}</p>
    </div>
    )}

    {/* Desired Skills */}
    {track.desired_skills && track.desired_skills.length > 0 && (
    <div className="skills-section glass animate-slide-up stagger-6">
        <h2>🎯 Looking For</h2>
        <div className="skills-tags">
        {track.desired_skills.map((skill, index) => (
            <span key={index} className="skill-tag">{skill}</span>
        ))}
        </div>
    </div>
    )}

    {/* Collaborators Section */}
    {collaborators.length > 0 && (
    <div className="collaborators-section glass animate-slide-up stagger-7">
        <h2>🤝 Current Collaborators</h2>
        <div className="collaborators-list">
        {collaborators.map((collab) => (
            <div key={collab.id} className="collaborator-item">
            <Link to={`/profile/${collab.id}`} className="flex items-center gap-3 group">
                <div className="collaborator-avatar group-hover:scale-105 transition-transform">
                {collab.username?.charAt(0).toUpperCase()}
                </div>
                <div className="collaborator-info">
                <span className="collaborator-name">@{collab.username}</span>
                <span className="collaborator-role">{collab.role || 'Collaborator'}</span>
                </div>
            </Link>
            {user && user.id !== collab.id && (
                <Link
                to={`/messages/new?userId=${collab.id}`}
                className="ml-auto text-xs text-[var(--text-tertiary)] hover:text-primary-400 px-2 py-1 rounded-lg hover:bg-primary-500/10 transition-all"
                >
                Message
                </Link>
            )}
            </div>
        ))}
        </div>
    </div>
    )}

    {/* Submissions */}
    <div className="submissions-section glass animate-slide-up stagger-8">
    <div className="section-header">
        <h2>🏆 Submissions</h2>
        {submissionsCount > 0 && (
        <Link to={`/tracks/${trackId}/submissions`} className="btn-view-all">
            View All ({submissionsCount}) →
        </Link>
        )}
    </div>
    <SubmissionList trackId={trackId} limit={3} />
    {submissionsCount === 0 && (
        <div className="text-center py-8 text-[var(--text-secondary)]">
        No submissions yet.{' '}
        {hasApprovedCollab && (
            <Link to={`/tracks/${trackId}/submissions`} className="text-primary-400 hover:text-primary-300">
            Be the first to submit!
            </Link>
        )}
        </div>
    )}
    </div>

    {/* Comments Section */}
    {submissionsCount > 0 && track.latest_submission_id && (
    <div className="comments-section glass animate-slide-up">
        <CommentSection submissionId={track.latest_submission_id} />
    </div>
    )}
</div>
);
};

export default TrackDetailPage;