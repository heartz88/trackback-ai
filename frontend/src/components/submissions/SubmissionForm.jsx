import { useState } from 'react';
import api from '../../services/api';

const SubmissionForm = ({ trackId, collaborationId, onSuccess, onCancel }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-m4a'];
            if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a)$/i)) {
                setError('Please upload a valid audio file (MP3, WAV, or M4A)');
                return;
            }

            // Validate file size (50MB max)
            if (file.size > 50 * 1024 * 1024) {
                setError('File size must be less than 50MB');
                return;
            }

            setAudioFile(file);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        if (!audioFile) {
            setError('Please select an audio file');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('audio', audioFile);
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('track_id', trackId);
            formData.append('collaboration_id', collaborationId);

            const response = await api.post('/submissions', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                },
            });

            console.log('✅ Submission created:', response.data);
            
            if (onSuccess) {
                onSuccess(response.data.submission);
            }
        } catch (error) {
            console.error('❌ Submission error:', error);
            setError(
                error.response?.data?.error?.message || 
                'Failed to submit. Please try again.'
            );
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="submission-form-container">
            <form onSubmit={handleSubmit} className="submission-form">
                <h2 className="form-title">Submit Your Version</h2>
                <p className="form-subtitle">
                    Upload your completed version of this track
                </p>

                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}

                {/* Title Input */}
                <div className="form-group">
                    <label htmlFor="title">
                        Title <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="My Completed Version"
                        maxLength={100}
                        disabled={isUploading}
                        required
                    />
                </div>

                {/* Description Input */}
                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what you added (vocals, drums, mixing, etc.)..."
                        rows={4}
                        maxLength={500}
                        disabled={isUploading}
                    />
                    <div className="char-count">
                        {description.length}/500
                    </div>
                </div>

                {/* File Upload */}
                <div className="form-group">
                    <label htmlFor="audio">
                        Audio File <span className="required">*</span>
                    </label>
                    <div className="file-upload">
                        <input
                            type="file"
                            id="audio"
                            accept="audio/*,.mp3,.wav,.m4a"
                            onChange={handleFileChange}
                            disabled={isUploading}
                            required
                        />
                        <label htmlFor="audio" className="file-upload-label">
                            {audioFile ? (
                                <div className="file-info">
                                    <span className="file-icon">🎵</span>
                                    <div>
                                        <div className="file-name">{audioFile.name}</div>
                                        <div className="file-size">
                                            {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="file-placeholder">
                                    <span className="upload-icon">📁</span>
                                    <span>Choose audio file</span>
                                    <span className="file-hint">MP3, WAV, or M4A (max 50MB)</span>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                    <div className="upload-progress">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <div className="progress-text">
                            Uploading... {uploadProgress}%
                        </div>
                    </div>
                )}

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn-secondary"
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isUploading || !title.trim() || !audioFile}
                    >
                        {isUploading ? (
                            <>
                                <span className="spinner"></span>
                                Uploading...
                            </>
                        ) : (
                            'Submit Version'
                        )}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .submission-form-container {
                    background: #1e1e2f;
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .submission-form {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .form-title {
                    color: #ffffff;
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0;
                }

                .form-subtitle {
                    color: #b4b4b4;
                    font-size: 14px;
                    margin: -16px 0 0 0;
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid #ef4444;
                    color: #ef4444;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 600;
                }

                .required {
                    color: #ef4444;
                }

                .form-group input[type="text"],
                .form-group textarea {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: all 0.2s;
                }

                .form-group input[type="text"]:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #9b59b6;
                    background: rgba(155, 89, 182, 0.05);
                }

                .form-group input[type="text"]:disabled,
                .form-group textarea:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .char-count {
                    color: #b4b4b4;
                    font-size: 12px;
                    text-align: right;
                    margin-top: -4px;
                }

                .file-upload input[type="file"] {
                    display: none;
                }

                .file-upload-label {
                    display: block;
                    background: rgba(0, 0, 0, 0.3);
                    border: 2px dashed rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    padding: 24px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .file-upload-label:hover {
                    border-color: #9b59b6;
                    background: rgba(155, 89, 182, 0.05);
                }

                .file-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    color: #b4b4b4;
                }

                .upload-icon {
                    font-size: 48px;
                }

                .file-hint {
                    font-size: 12px;
                    color: #6b7280;
                }

                .file-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .file-icon {
                    font-size: 32px;
                }

                .file-name {
                    color: #ffffff;
                    font-weight: 600;
                }

                .file-size {
                    color: #b4b4b4;
                    font-size: 12px;
                }

                .upload-progress {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #9b59b6, #00d9ff);
                    transition: width 0.3s ease;
                }

                .progress-text {
                    color: #b4b4b4;
                    font-size: 14px;
                    text-align: center;
                }

                .form-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 8px;
                }

                .btn-primary,
                .btn-secondary {
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #9b59b6, #e94560);
                    color: white;
                }

                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(155, 89, 182, 0.4);
                }

                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.05);
                    color: #b4b4b4;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .btn-secondary:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                }

                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .submission-form-container {
                        padding: 24px;
                    }

                    .form-actions {
                        flex-direction: column-reverse;
                    }

                    .btn-primary,
                    .btn-secondary {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default SubmissionForm;