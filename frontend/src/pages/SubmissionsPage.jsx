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
const [collaboration, setCollaboration] = useState(null);
const [showSubmitForm, setShowSubmitForm] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');
const [refreshKey, setRefreshKey] = useState(0);
const [votingStats, setVotingStats] = useState({
totalVotes: 0,
activeSubmissions: 0,
featured: 0
});
const [submissionsCount, setSubmissionsCount] = useState(0);

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
} catch (error) {
    console.error('Error fetching track:', error);
    setError('Failed to load track');
} finally {
    setIsLoading(false);
}
};

const fetchCollaboration = async () => {
if (!user) return;
try {
    const response = await api.get(`/collaborations/track/${trackId}`);
    if (response.data.collaboration) {
    setCollaboration(response.data.collaboration);
    }
} catch (error) {
    console.error('Error fetching collaboration:', error);
}
};

const fetchVotingStats = async () => {
try {
    const response = await api.get(`/submissions/track/${trackId}/stats`);
    setVotingStats(response.data.stats || {
    totalVotes: 0,
    activeSubmissions: 0,
    featured: 0
    });
} catch (error) {
    console.error('Error fetching voting stats:', error);
}
};

const fetchSubmissionsCount = async () => {
try {
    const response = await api.get(`/submissions/track/${trackId}`);
    setSubmissionsCount(response.data.submissions?.length || 0);
} catch (error) {
    setSubmissionsCount(0);
}
};

const handleSubmissionSuccess = (newSubmission) => {
setShowSubmitForm(false);
setRefreshKey(prev => prev + 1);
fetchVotingStats();
fetchSubmissionsCount();
};

const handleCompleteTrack = async () => {
if (!window.confirm('Are you sure you want to mark this track as completed? The highest voted submission will be selected as the final version.')) {
    return;
}
try {
    await api.post(`/collaborations/${trackId}/complete`);
    alert('Track marked as completed!');
    navigate(`/tracks/${trackId}`);
} catch (err) {
    console.error('Failed to complete track:', err);
    alert(err.response?.data?.error?.message || 'Failed to complete track');
}
};

const canSubmit = collaboration && collaboration.status === 'approved';
const isOwner = user && track && user.id === track.user_id;

if (isLoading) {
return (
    <div className="submissions-page">
    <div className="page-loading">
        <div className="music-loader">
        <div className="music-loader-bar"></div>
        <div className="music-loader-bar"></div>
        <div className="music-loader-bar"></div>
        <div className="music-loader-bar"></div>
        <div className="music-loader-bar"></div>
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
        <Link to="/discover" className="btn-primary">
        Browse Tracks
        </Link>
    </div>
    </div>
);
}

return (
<div className="submissions-page animate-fade-in">
    {/* Header */}
    <div className="page-header">
    <Link to={`/tracks/${trackId}`} className="back-link">
        <svg className="back-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Track
    </Link>
    
    <div className="header-content">
        <div>
        <h1 className="animate-slide-up">Submissions</h1>
        <p className="track-title animate-slide-up stagger-1">
            for "{track.title}"
        </p>
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

    {/* Complete Track Button for Owner */}
    {isOwner && submissionsCount > 0 && (
    <div className="flex justify-end mb-6">
        <button
        onClick={handleCompleteTrack}
        className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all"
        >
        ✅ Mark Track as Completed
        </button>
    </div>
    )}

    {/* Submission Guidelines */}
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
        <button
        onClick={() => setShowSubmitForm(true)}
        className="btn-submit"
        >
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
    <SubmissionList
        trackId={trackId}
        collaborationId={collaboration?.id}
        key={refreshKey}
    />
    </div>
</div>
);
};

export default SubmissionsPage;