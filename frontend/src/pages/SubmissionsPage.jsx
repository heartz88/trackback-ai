import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SubmissionForm from '../components/submissions/SubmissionForm';
import SubmissionList from '../components/submissions/SubmissionList';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SubmissionsPage = () => {
const { trackId } = useParams();
const { user } = useAuth();
const navigate = useNavigate();
const [track, setTrack] = useState(null);
const [owner, setOwner] = useState(null);
const [collaboration, setCollaboration] = useState(null);
const [showSubmitForm, setShowSubmitForm] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');
const [refreshKey, setRefreshKey] = useState(0);
const [votingStats, setVotingStats] = useState({ totalVotes: 0, activeSubmissions: 0, featured: 0 });
const [submissionsCount, setSubmissionsCount] = useState(0);
const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState(false);

useEffect(() => {
fetchTrack();
fetchCollaboration();
fetchVotingStats();
fetchSubmissionsCount();
}, [trackId]);

const fetchTrack = async () => {
try {
    const response = await api.get(`/tracks/${trackId}`);
    setTrack(response.data.track);
    // Fetch owner info
    try {
    const ownerRes = await api.get(`/users/${response.data.track.user_id}`);
    setOwner(ownerRes.data.user);
    } catch {}
} catch (error) {
    setError('Failed to load track');
} finally {
    setIsLoading(false);
}
};

const fetchCollaboration = async () => {
if (!user) return;
try {
    const response = await api.get(`/collaborations/track/${trackId}`);
    if (response.data.collaboration) setCollaboration(response.data.collaboration);
} catch {}
};

const fetchVotingStats = async () => {
try {
    const response = await api.get(`/submissions/track/${trackId}/stats`);
    setVotingStats(response.data.stats || { totalVotes: 0, activeSubmissions: 0, featured: 0 });
} catch {}
};

const fetchSubmissionsCount = async () => {
try {
    const response = await api.get(`/submissions/track/${trackId}`);
    const submissions = response.data.submissions || [];
    setSubmissionsCount(submissions.length);
    // Check if the current user has already submitted
    if (user) {
    setHasAlreadySubmitted(submissions.some((s) => s.collaborator_id === user.id));
    }
} catch {
    setSubmissionsCount(0);
}
};

const handleSubmissionSuccess = () => {
setShowSubmitForm(false);
setRefreshKey((prev) => prev + 1);
fetchVotingStats();
fetchSubmissionsCount();
};

const handleCompleteTrack = async () => {
if (!window.confirm('Mark this track as completed? The highest voted submission will be selected as the final version.')) return;
try {
    await api.post(`/collaborations/${trackId}/complete`);
    alert('Track marked as completed!');
    navigate(`/tracks/${trackId}`);
} catch (err) {
    alert(err.response?.data?.error?.message || 'Failed to complete track');
}
};

const canSubmit = collaboration && collaboration.status === 'approved' && !hasAlreadySubmitted;
const isOwner = user && track && user.id === track.user_id;

if (isLoading) {
return (
    <div className="submissions-page">
    <div className="page-loading">
        <div className="music-loader">
        {[...Array(5)].map((_, i) => <div key={i} className="music-loader-bar"></div>)}
        </div>
        <p className="mt-4 text-secondary animate-pulse">Loading submissions...</p>
    </div>
    </div>
);
}

if (error || !track) {
return (
    <div className="submissions-page">
    <div className="page-error animate-fade-in">
        <h2>Track Not Found</h2>
        <p>{error || 'This track does not exist'}</p>
        <Link to="/discover" className="btn-primary">Browse Tracks</Link>
    </div>
    </div>
);
}

return (
<div className="submissions-page animate-fade-in">
    {/* Header */}
    <div className="page-header">
    {/* Breadcrumb nav */}
    <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mb-4">
        <Link to="/discover" className="hover:text-primary-400 transition-colors">Discover</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link to={`/tracks/${trackId}`} className="hover:text-primary-400 transition-colors truncate max-w-[140px]">
        {track.title}
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>Submissions</span>
    </div>

    <Link to={`/tracks/${trackId}`} className="back-link">
        <svg className="back-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Track
    </Link>

    <div className="header-content">
        <div>
        <h1 className="animate-slide-up">Submissions</h1>
        <div className="flex items-center gap-3 flex-wrap mt-1">
            <p className="track-title animate-slide-up stagger-1">for "{track.title}"</p>
            {owner && (
            <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                by{' '}
                <Link to={`/profile/${owner.id}`} className="text-primary-400 hover:text-primary-300 font-medium">
                @{owner.username}
                </Link>
                {user && !isOwner && (
                <Link
                    to={`/messages/new?userId=${owner.id}`}
                    className="ml-1 px-2 py-0.5 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-tertiary)] hover:text-primary-400 rounded text-xs transition-all border border-[var(--border-color)]"
                >
                    Message
                </Link>
                )}
            </span>
            )}
        </div>
        </div>

        <div className="track-info animate-slide-up stagger-2">
        <span className="info-item">
            <span className="info-label">BPM</span>
            <span className="info-value">{track.bpm ? Math.round(track.bpm) : '—'}</span>
        </span>
        <span className="info-item">
            <span className="info-label">Key</span>
            <span className="info-value">{track.musical_key || '—'}</span>
        </span>
        <span className="info-item">
            <span className="info-label">Energy</span>
            <span className="info-value">{track.energy_level || '—'}</span>
        </span>
        <span className="info-item">
            <span className="info-label">Genre</span>
            <span className="info-value">{track.genre || '—'}</span>
        </span>
        </div>
    </div>
    </div>

    {/* Voting Summary */}
    <div className="voting-summary glass animate-slide-up stagger-3">
    <h3>🏆 Community Voting</h3>
    <div className="summary-stats">
        <div className="summary-item">
        <span className="summary-label">Total Votes</span>
        <span className="summary-value">{votingStats.totalVotes}</span>
        </div>
        <div className="summary-item">
        <span className="summary-label">Active Submissions</span>
        <span className="summary-value">{votingStats.activeSubmissions}</span>
        </div>
        <div className="summary-item">
        <span className="summary-label">Featured</span>
        <span className="summary-value">{votingStats.featured}</span>
        </div>
    </div>
    </div>

    {/* Owner: Complete Track */}
    {isOwner && submissionsCount > 0 && (
    <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
        <p className="text-sm text-[var(--text-secondary)]">
        You have {submissionsCount} submission{submissionsCount !== 1 ? 's' : ''}. Ready to select a winner?
        </p>
        <button
        onClick={handleCompleteTrack}
        className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all"
        >
        ✅ Mark Track as Completed
        </button>
    </div>
    )}

    {/* Not a collaborator — explain */}
    {!canSubmit && !isOwner && user && (
    <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] mb-6 animate-slide-up stagger-4">
        <p className="text-[var(--text-secondary)] text-sm">
        You need an <strong className="text-[var(--text-primary)]">approved collaboration</strong> to submit a version.{' '}
        <Link to={`/tracks/${trackId}`} className="text-primary-400 hover:text-primary-300 font-medium">
            Request to collaborate on this track →
        </Link>
        </p>
    </div>
    )}

    {/* Not logged in */}
    {!user && (
    <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] mb-6 text-center animate-slide-up stagger-4">
        <p className="text-[var(--text-secondary)] mb-3">Sign in to submit your version and vote on submissions</p>
        <div className="flex gap-3 justify-center">
        <Link to="/login" className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all text-sm">
            Sign In
        </Link>
        <Link to="/register" className="px-5 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-semibold rounded-xl transition-all text-sm border border-[var(--border-color)]">
            Register
        </Link>
        </div>
    </div>
    )}

    {collaboration && collaboration.status === 'approved' && hasAlreadySubmitted && (
    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl mb-6 animate-slide-up stagger-4">
        <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div>
        <p className="text-green-400 font-medium text-sm">You've already submitted a version!</p>
        <p className="text-[var(--text-tertiary)] text-xs mt-0.5">Your submission is in the list below. Each collaborator can only submit one version.</p>
        </div>
    </div>
    )}

    {/* Guidelines */}
    {canSubmit && !showSubmitForm && (
    <div className="guidelines-card animate-slide-up stagger-4">
        <h3>📋 Submission Guidelines</h3>
        <ul className="guidelines-list">
        <li>✅ Submit only your own work</li>
        <li>✅ Include a clear description of what you added</li>
        <li>✅ Max file size: 50MB</li>
        <li>✅ Supported formats: MP3, WAV, FLAC</li>
        <li>⭐ Top voted submissions get featured</li>
        </ul>
    </div>
    )}

    {/* Submit Button */}
    {canSubmit && !showSubmitForm && (
    <div className="submit-section animate-slide-up stagger-5">
        <button onClick={() => setShowSubmitForm(true)} className="btn-submit">
        <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Submit Your Version
        </button>
    </div>
    )}

    {/* Submission Form */}
    {showSubmitForm && (
    <div className="form-container animate-slide-up">
        <SubmissionForm
        trackId={trackId}
        collaborationId={collaboration?.id}
        onSuccess={handleSubmissionSuccess}
        onCancel={() => setShowSubmitForm(false)}
        />
    </div>
    )}

    {/* Submissions List */}
    <div className="submissions-container animate-slide-up stagger-6">
    <SubmissionList trackId={trackId} collaborationId={collaboration?.id} key={refreshKey} />
    </div>
</div>
);
};

export default SubmissionsPage;