import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function UploadPage() {
const [file, setFile] = useState(null);
const [formData, setFormData] = useState({
title: '',
description: '',
genre: '',
desired_skills: ''
});
const [uploading, setUploading] = useState(false);
const [success, setSuccess] = useState('');
const [error, setError] = useState('');
const navigate = useNavigate();

const handleSubmit = async (e) => {
e.preventDefault();
setError('');
setSuccess('');

if (!file) {
    setError('Please select an audio file');
    return;
}

if (!formData.title.trim()) {
    setError('Track title is required');
    return;
}

setUploading(true);

const data = new FormData();
data.append('audio', file);
data.append('title', formData.title);
data.append('description', formData.description);
data.append('genre', formData.genre);
if (formData.desired_skills) {
    data.append('desired_skills', formData.desired_skills);
}

try {
    console.log('📤 Uploading track...');
    
    // Set proper headers for FormData
    const response = await api.post('/tracks/upload', data, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
    });
    
    console.log('✅ Upload response:', response.data);
    
    setSuccess('Track uploaded successfully! Analysis in progress...');
    
    setTimeout(() => {
    navigate('/my-tracks');
    }, 3000);
    
} catch (err) {
    console.error('❌ Upload error:', err);
    
    let errorMessage = 'Upload failed: ';
    
    if (err.response) {
    // Server responded with an error
    if (err.response.data && err.response.data.error) {
        errorMessage += err.response.data.error.message || err.response.data.error;
    } else if (err.response.data && err.response.data.errors) {
        errorMessage += err.response.data.errors.map(e => e.msg).join(', ');
    } else if (err.response.status === 413) {
        errorMessage = 'File too large. Maximum size is 50MB.';
    } else {
        errorMessage += `Server error (${err.response.status})`;
    }
    } else if (err.request) {
    // Request was made but no response
    errorMessage += 'Network error. Please check your connection.';
    } else {
    // Something else happened
    errorMessage += err.message;
    }
    
    setError(errorMessage);
} finally {
    setUploading(false);
}
};

return (
<div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
    <div className="max-w-3xl mx-auto">
    <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">Upload Your Track</h1>
        <p className="text-[var(--text-secondary)]">Share your music and find collaborators</p>
    </div>

    {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl mb-8 text-center">
        {error}
        </div>
    )}

    {success && (
        <div className="bg-primary-500/10 border border-primary-500/50 text-primary-400 px-6 py-4 rounded-xl mb-8 text-center">
        {success}
        </div>
    )}

    <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl shadow-2xl space-y-6">
        <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">Audio File *</label>
        <div className={`relative border-2 border-dashed ${file ? 'border-primary-500' : 'border-[var(--border-color)]'} rounded-xl p-8 hover:border-primary-500 transition-colors`}>
            <input
            type="file"
            accept=".mp3,.wav,.flac,.m4a,.aac,audio/mpeg,audio/wav,audio/flac,audio/x-wav,audio/x-m4a,audio/mp4,audio/aac"
            onChange={(e) => {
                const selectedFile = e.target.files[0];
                if (selectedFile) {
                if (selectedFile.size > 50 * 1024 * 1024) {
                    setError('File size must be less than 50MB');
                    setFile(null);
                } else {
                    setError('');
                    setFile(selectedFile);
                }
                }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            required
            disabled={uploading}
            />
            <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-[var(--text-tertiary)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-[var(--text-secondary)] mb-1">
                {file ? (
                <span className="text-primary-400">
                    ✓ {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
                ) : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">MP3, WAV, FLAC, M4A, AAC up to 50MB</p>
            </div>
        </div>
        </div>

        <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Track Title *</label>
        <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter track title"
            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            required
            disabled={uploading}
        />
        </div>

        <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Description</label>
        <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Tell us about your track, inspiration, mood..."
            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
            rows="4"
            disabled={uploading}
        />
        </div>

        <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Genre</label>
        <input
            type="text"
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
            placeholder="e.g., Electronic, Hip-Hop, Rock, Lo-Fi"
            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            disabled={uploading}
        />
        </div>

        <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Desired Skills (comma-separated)
        </label>
        <input
            type="text"
            value={formData.desired_skills}
            onChange={(e) => setFormData({ ...formData, desired_skills: e.target.value })}
            placeholder="e.g., mixing, mastering, vocals, guitar"
            className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            disabled={uploading}
        />
        </div>

        <button
        type="submit"
        disabled={uploading || !file || !formData.title.trim()}
        className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/25 disabled:shadow-none disabled:cursor-not-allowed"
        >
        {uploading ? (
            <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
            </span>
        ) : 'Upload Track'}
        </button>
        
        <p className="text-xs text-[var(--text-tertiary)] text-center mt-4">
        * Required fields. Your track will be analyzed for BPM, energy level, and other features automatically.
        </p>
    </form>
    </div>
</div>
);
}

export default UploadPage;