import { useEffect, useState } from 'react';
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

    useEffect(() => {
        fetchTrackDetails();
    }, [trackId]);

    const fetchTrackDetails = async () => {
        setIsLoading(true);
        setError('');

        try {
            // Fetch track
            const trackResponse = await api.get(`/tracks/${trackId}`);
            setTrack(trackResponse.data.track);

            // Fetch owner
            const ownerResponse = await api.get(`/users/${trackResponse.data.track.user_id}`);
            setOwner(ownerResponse.data.user);

            // Check if user has existing collaboration
            if (user) {
                try {
                    const collabResponse = await api.get(`/collaborations/track/${trackId}`);
                    setCollaboration(collabResponse.data.collaboration);
                } catch (error) {
                    // No collaboration exists yet
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
            const response = await api.post('/collaborations', {
                track_id: trackId,
                message: `I'd like to collaborate on "${track.title}"`
            });

            setCollaboration(response.data.collaboration);
            alert('Collaboration request sent!');
        } catch (error) {
            console.error('Error requesting collaboration:', error);
            alert(error.response?.data?.error?.message || 'Failed to send collaboration request');
        } finally {
            setRequestingCollab(false);
        }
    };

    const isOwner = user && track && user.id === track.user_id;
    const canRequestCollab = user && !isOwner && !collaboration;
    const hasApprovedCollab = collaboration?.status === 'approved';

    if (isLoading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading track...</p>
            </div>
        );
    }

    if (error || !track) {
        return (
            <div className="page-error">
                <h2>Track Not Found</h2>
                <p>{error || 'This track does not exist'}</p>
                <Link to="/discover" className="btn-primary">
                    Browse Tracks
                </Link>
            </div>
        );
    }

    return (
        <div className="track-detail-page">
            {/* Hero Section */}
            <div className="track-hero">
                <div className="hero-content">
                    <div className="waveform-container">
                        <WaveformPlayer 
                            audioUrl={track.audio_url}
                            height={200}
                        />
                    </div>

                    <div className="track-meta">
                        <h1>{track.title}</h1>
                        <div className="owner-info">
                            <div className="avatar">
                                {owner?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <Link to={`/profile/${owner?.id}`} className="owner-link">
                                    {owner?.username}
                                </Link>
                                <span className="upload-date">
                                    • {new Date(track.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="music-chips">
                            <span className="chip">🎵 {track.bpm} BPM</span>
                            <span className="chip">🎹 {track.musical_key}</span>
                            <span className="chip">⚡ {track.energy_level}</span>
                            <span className="chip">🎸 {track.genre}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="track-actions">
                    {canRequestCollab && (
                        <button 
                            onClick={handleRequestCollaboration}
                            className="btn-primary btn-large"
                            disabled={requestingCollab}
                        >
                            🤝 Request Collaboration
                        </button>
                    )}

                    {collaboration && (
                        <div className="collab-status">
                            {collaboration.status === 'pending' && (
                                <span className="status-badge pending">
                                    ⏳ Collaboration Pending
                                </span>
                            )}
                            {collaboration.status === 'approved' && (
                                <span className="status-badge approved">
                                    ✅ Collaboration Approved
                                </span>
                            )}
                            {collaboration.status === 'rejected' && (
                                <span className="status-badge rejected">
                                    ❌ Collaboration Declined
                                </span>
                            )}
                        </div>
                    )}

                    {isOwner && (
                        <Link to={`/my-tracks`} className="btn-secondary btn-large">
                            ✏️ Manage Track
                        </Link>
                    )}
                </div>
            </div>

            {/* Description */}
            {track.description && (
                <div className="description-section">
                    <h2>📋 Description</h2>
                    <p>{track.description}</p>
                </div>
            )}

            {/* Desired Skills */}
            {track.desired_skills && track.desired_skills.length > 0 && (
                <div className="skills-section">
                    <h2>🎯 Desired Skills</h2>
                    <div className="skills-tags">
                        {track.desired_skills.map((skill, index) => (
                            <span key={index} className="skill-tag">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Submissions */}
            <div className="submissions-section">
                <div className="section-header">
                    <h2>🏆 Submissions</h2>
                    {hasApprovedCollab && (
                        <Link 
                            to={`/tracks/${trackId}/submissions`}
                            className="btn-view-all"
                        >
                            View All Submissions →
                        </Link>
                    )}
                </div>

                <SubmissionList 
                    trackId={trackId}
                    collaborationId={collaboration?.id}
                />
            </div>

            <style jsx>{`
                .track-detail-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 24px;
                }

                .page-loading,
                .page-error {
                    text-align: center;
                    padding: 64px 24px;
                    color: #ffffff;
                }

                .spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid rgba(255, 255, 255, 0.1);
                    border-top-color: #9b59b6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin: 0 auto 16px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .track-hero {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    padding: 40px;
                    margin-bottom: 32px;
                }

                .hero-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    align-items: center;
                    margin-bottom: 32px;
                }

                .track-meta h1 {
                    color: #ffffff;
                    font-size: 32px;
                    font-weight: 700;
                    margin: 0 0 16px 0;
                }

                .owner-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #9b59b6, #e94560);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 20px;
                }

                .owner-link {
                    color: #9b59b6;
                    text-decoration: none;
                    font-weight: 600;
                    transition: color 0.2s;
                }

                .owner-link:hover {
                    color: #e94560;
                }

                .upload-date {
                    color: #b4b4b4;
                    font-size: 14px;
                }

                .music-chips {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .chip {
                    padding: 6px 16px;
                    background: rgba(155, 89, 182, 0.2);
                    border: 1px solid rgba(155, 89, 182, 0.4);
                    color: #ffffff;
                    border-radius: 20px;
                    font-size: 14px;
                }

                .track-actions {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .btn-primary,
                .btn-secondary {
                    padding: 14px 32px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    text-decoration: none;
                    display: inline-block;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #9b59b6, #e94560);
                    color: white;
                }

                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(155, 89, 182, 0.4);
                }

                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                .collab-status {
                    display: flex;
                    align-items: center;
                }

                .status-badge {
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                }

                .status-badge.pending {
                    background: rgba(245, 158, 11, 0.2);
                    color: #f59e0b;
                    border: 1px solid #f59e0b;
                }

                .status-badge.approved {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                    border: 1px solid #10b981;
                }

                .status-badge.rejected {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    border: 1px solid #ef4444;
                }

                .description-section,
                .skills-section,
                .submissions-section {
                    background: #1e1e2f;
                    border-radius: 12px;
                    padding: 32px;
                    margin-bottom: 24px;
                }

                .description-section h2,
                .skills-section h2,
                .submissions-section h2 {
                    color: #ffffff;
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0 0 16px 0;
                }

                .description-section p {
                    color: #b4b4b4;
                    line-height: 1.8;
                    margin: 0;
                }

                .skills-tags {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .skill-tag {
                    padding: 8px 16px;
                    background: rgba(0, 217, 255, 0.1);
                    border: 1px solid rgba(0, 217, 255, 0.3);
                    color: #00d9ff;
                    border-radius: 8px;
                    font-size: 14px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .btn-view-all {
                    color: #9b59b6;
                    text-decoration: none;
                    font-weight: 600;
                    transition: color 0.2s;
                }

                .btn-view-all:hover {
                    color: #e94560;
                }

                @media (max-width: 1024px) {
                    .hero-content {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .track-detail-page {
                        padding: 16px;
                    }

                    .track-hero {
                        padding: 24px;
                    }

                    .track-meta h1 {
                        font-size: 24px;
                    }

                    .track-actions {
                        flex-direction: column;
                    }

                    .btn-primary,
                    .btn-secondary {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default TrackDetailPage;