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
        </div>
    );
};

export default SubmissionForm;