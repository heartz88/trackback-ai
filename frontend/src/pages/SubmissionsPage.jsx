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

    useEffect(() => {
        fetchTrack();
        fetchCollaboration();
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
        try {
            // Get user's collaboration for this track
            const response = await api.get(`/collaborations/track/${trackId}`);
            if (response.data.collaboration) {
                setCollaboration(response.data.collaboration);
            }
        } catch (error) {
            console.error('Error fetching collaboration:', error);
        }
    };

    const handleSubmissionSuccess = (newSubmission) => {
        setShowSubmitForm(false);
        setRefreshKey(prev => prev + 1); // Trigger re-fetch
    };

    const canSubmit = collaboration && collaboration.status === 'approved';

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
        <div className="submissions-page">
            {/* Header */}
            <div className="page-header">
                <Link to={`/tracks/${trackId}`} className="back-btn">
                    ← Back to Track
                </Link>
                <h1>Submissions for "{track.title}"</h1>
                <p className="track-info">
                    {track.bpm} BPM • {track.musical_key} • {track.genre}
                </p>
            </div>

            {/* Submit Button */}
            {canSubmit && !showSubmitForm && (
                <div className="submit-section">
                    <button 
                        onClick={() => setShowSubmitForm(true)}
                        className="btn-submit"
                    >
                        ➕ Submit Your Version
                    </button>
                </div>
            )}

            {/* Submission Form */}
            {showSubmitForm && (
                <div className="form-container">
                    <SubmissionForm
                        trackId={trackId}
                        collaborationId={collaboration?.id}
                        onSuccess={handleSubmissionSuccess}
                        onCancel={() => setShowSubmitForm(false)}
                    />
                </div>
            )}

            {/* Submissions List */}
            <SubmissionList 
                trackId={trackId}
                collaborationId={collaboration?.id}
                key={refreshKey}
            />

            <style jsx>{`
                .submissions-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 24px;
                }

                .page-loading,
                .page-error {
                    text-align: center;
                    padding: 64px 24px;
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

                .page-error h2 {
                    color: #ffffff;
                    margin-bottom: 16px;
                }

                .page-error p {
                    color: #b4b4b4;
                    margin-bottom: 24px;
                }

                .btn-primary {
                    display: inline-block;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #9b59b6, #e94560);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    transition: transform 0.2s;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                }

                .page-header {
                    margin-bottom: 32px;
                }

                .back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #9b59b6;
                    text-decoration: none;
                    font-size: 14px;
                    margin-bottom: 16px;
                    transition: color 0.2s;
                }

                .back-btn:hover {
                    color: #e94560;
                }

                .page-header h1 {
                    color: #ffffff;
                    font-size: 32px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                }

                .track-info {
                    color: #b4b4b4;
                    font-size: 16px;
                    margin: 0;
                }

                .submit-section {
                    margin-bottom: 32px;
                    text-align: center;
                    padding: 24px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                    border: 2px dashed rgba(155, 89, 182, 0.3);
                }

                .btn-submit {
                    padding: 14px 32px;
                    background: linear-gradient(135deg, #9b59b6, #e94560);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-submit:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(155, 89, 182, 0.4);
                }

                .form-container {
                    margin-bottom: 32px;
                }

                @media (max-width: 768px) {
                    .submissions-page {
                        padding: 16px;
                    }

                    .page-header h1 {
                        font-size: 24px;
                    }
                }
            `}</style>
        </div>
    );
};
export default SubmissionsPage;