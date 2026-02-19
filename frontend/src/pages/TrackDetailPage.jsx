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
    } catch (error) {
    setSubmissionsCount(0);
    }

    try {
    const collabResponse = await api.get(`/collaborations/track/${trackId}/active`);
    setCollaborators(collabResponse.data.collaborators || []);
    } catch (error) {
    setCollaborators([]);
    }

    if (user) {
    try {
        const collabResponse = await api.get(`/collaborations/track/${trackId}`);
        setCollaboration(collabResponse.data.collaboration);
    } catch (error) {
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

setRequestingCollab(true);

try {
    const response = await api.post('/collaborations/request', {
    track_id: trackId,
    message: `I'd like to collaborate on "${track.title}"`
    });

    setCollaboration(response.data.request);
    alert('Collaboration request sent!');
} catch (error) {
    console.error('Error requesting collaboration:', error);
    alert(error.response?.data?.error?.message || 'Failed to send collaboration request');
} finally {
    setRequestingCollab(false);
}
};

const handleCompleteTrack = async () => {
if (!window.confirm('Are you sure you want to mark this track as completed? The highest voted submission will be selected as the final version.')) {
    return;
}
try {
    await api.post(`/collaborations/${trackId}/complete`);
    alert('Track marked as completed!');
    fetchTrackDetails();
} catch (err) {
    console.error('Failed to complete track:', err);
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
    <Link to="/discover" className="btn-primary">
        Browse Tracks
    </Link>
    </div>
);
}

return (
<div className="track-detail-page animate-fade-in">
    {/* Hero Section */}
    <div className="track-hero glass-strong">
    <div className="hero-content">
        <div className="waveform-container glass">
        <WaveformPlayer 
            audioUrl={track.audio_url}
            height={200}
        />
        </div>

        <div className="track-meta">
        <h1 className="animate-slide-up">{track.title}</h1>
        
        <div className="owner-info animate-slide-up stagger-1">
            <div className="avatar bpm-badge">
            {owner?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
            <Link to={`/profile/${owner?.id}`} className="owner-link">
                @{owner?.username}
            </Link>
            <span className="upload-date">
                • {new Date(track.created_at).toLocaleDateString()}
            </span>
            </div>
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
            <span className="stat-value">{collaborators.length || 0}</span>
            </div>
        </div>

        {/* MIR Tags */}
        <div className="music-chips animate-slide-up stagger-3">
            {track.bpm && (
            <span className="chip bpm-badge">
                🎵 {Math.round(track.bpm)} BPM
            </span>
            )}
            {track.musical_key && (
            <span className="chip genre-tag">
                🎹 {track.musical_key}
            </span>
            )}
            {track.energy_level && (
            <span className="chip" style={{
                background: track.energy_level === 'high' ? 'rgba(239, 68, 68, 0.2)' :
                            track.energy_level === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                borderColor: track.energy_level === 'high' ? '#ef4444' :
                            track.energy_level === 'medium' ? '#f59e0b' : '#10b981'
            }}>
                ⚡ {track.energy_level}
            </span>
            )}
            {track.genre && (
            <span className="chip genre-tag">
                🎸 {track.genre}
            </span>
            )}
        </div>
        </div>
    </div>

    {/* Actions */}
    <div className="track-actions animate-slide-up stagger-4">
        {canRequestCollab && (
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
            ) : (
            '🤝 Request Collaboration'
            )}
        </button>
        )}

        {collaboration && (
        <div className="collab-status">
            {collaboration.status === 'pending' && (
            <span className="status-badge pending glass">
                ⏳ Collaboration Pending
            </span>
            )}
            {collaboration.status === 'approved' && (
            <span className="status-badge approved glass">
                ✅ Collaboration Approved
            </span>
            )}
            {collaboration.status === 'rejected' && (
            <span className="status-badge rejected glass">
                ❌ Collaboration Declined
            </span>
            )}
        </div>
        )}

        {isOwner && (
        <Link to={`/my-tracks`} className="btn-secondary glass">
            ✏️ Manage Track
        </Link>
        )}

        {hasApprovedCollab && (
        <Link 
            to={`/tracks/${trackId}/submissions`}
            className="btn-primary"
        >
            ➕ Submit Version
        </Link>
        )}

        {isOwner && submissionsCount > 0 && (
        <button
            onClick={handleCompleteTrack}
            className="btn-secondary glass"
        >
            ✅ Complete Track
        </button>
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
            <span key={index} className="skill-tag">
            {skill}
            </span>
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
            <div className="collaborator-avatar">
                {collab.username?.charAt(0).toUpperCase()}
            </div>
            <div className="collaborator-info">
                <Link to={`/profile/${collab.id}`} className="collaborator-name">
                @{collab.username}
                </Link>
                <span className="collaborator-role">{collab.role || 'Collaborator'}</span>
            </div>
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
        <Link 
            to={`/tracks/${trackId}/submissions`}
            className="btn-view-all"
        >
            View All ({submissionsCount}) →
        </Link>
        )}
    </div>

    <SubmissionList 
        trackId={trackId}
        limit={3}
    />
    
    {submissionsCount === 0 && (
        <div className="text-center py-8 text-[var(--text-secondary)]">
        No submissions yet. Be the first to submit a version!
        </div>
    )}
    </div>

    {/* Comments Section - Only show if there are submissions */}
    {submissionsCount > 0 && track.latest_submission_id && (
    <div className="comments-section glass animate-slide-up">
        <CommentSection 
        submissionId={track.latest_submission_id}
        />
    </div>
    )}
</div>
);
};

export default TrackDetailPage;