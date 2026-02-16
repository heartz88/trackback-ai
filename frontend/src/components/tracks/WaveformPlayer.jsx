import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

const WaveformPlayer = ({ audioUrl, height = 128, onReady, onPlay, onPause }) => {
const waveformRef = useRef(null);
const wavesurfer = useRef(null);
const [isPlaying, setIsPlaying] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [volume, setVolume] = useState(75);

useEffect(() => {
if (!waveformRef.current) return;

// Get CSS variables
const computedStyle = getComputedStyle(document.documentElement);
const accentColor = computedStyle.getPropertyValue('--accent-primary').trim() || '#14B8A6';
const textSecondary = computedStyle.getPropertyValue('--text-secondary').trim() || '#cbd5e1';

// Create WaveSurfer instance with theme colors
wavesurfer.current = WaveSurfer.create({
    container: waveformRef.current,
    waveColor: textSecondary,
    progressColor: accentColor,
    cursorColor: accentColor,
    barWidth: 2,
    barRadius: 3,
    cursorWidth: 2,
    height: height,
    barGap: 2,
    normalize: true,
    responsive: true,
    backend: 'WebAudio',
});

// Load audio
wavesurfer.current.load(audioUrl);

// Event listeners
wavesurfer.current.on('ready', () => {
    setIsLoading(false);
    setDuration(wavesurfer.current.getDuration());
    if (onReady) onReady();
});

wavesurfer.current.on('play', () => {
    setIsPlaying(true);
    if (onPlay) onPlay();
});

wavesurfer.current.on('pause', () => {
    setIsPlaying(false);
    if (onPause) onPause();
});

wavesurfer.current.on('audioprocess', () => {
    setCurrentTime(wavesurfer.current.getCurrentTime());
});

wavesurfer.current.on('seek', () => {
    setCurrentTime(wavesurfer.current.getCurrentTime());
});

// Cleanup
return () => {
    if (wavesurfer.current) {
    wavesurfer.current.destroy();
    }
};
}, [audioUrl, height, onReady, onPlay, onPause]);

const togglePlay = () => {
if (wavesurfer.current) {
    wavesurfer.current.playPause();
}
};

const handleVolumeChange = (e) => {
const newVolume = parseInt(e.target.value);
setVolume(newVolume);
if (wavesurfer.current) {
    wavesurfer.current.setVolume(newVolume / 100);
}
};

const formatTime = (seconds) => {
const mins = Math.floor(seconds / 60);
const secs = Math.floor(seconds % 60);
return `${mins}:${secs.toString().padStart(2, '0')}`;
};

return (
<div className="waveform-player glass">
    {/* Waveform Canvas */}
    <div 
    ref={waveformRef} 
    className={`waveform-canvas ${isLoading ? 'loading' : ''}`}
    />

    {/* Loading Overlay */}
    {isLoading && (
    <div className="waveform-loading">
        <div className="music-loader">
        <div className="music-loader-bar"></div>
        <div className="music-loader-bar"></div>
        <div className="music-loader-bar"></div>
        <div className="music-loader-bar"></div>
        <div className="music-loader-bar"></div>
        </div>
        <span className="text-[var(--text-secondary)]">Loading audio...</span>
    </div>
    )}

    {/* Controls */}
    <div className="waveform-controls">
    {/* Play/Pause Button */}
    <button 
        className="play-btn"
        onClick={togglePlay}
        disabled={isLoading}
    >
        {isPlaying ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
        ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
        </svg>
        )}
    </button>

    {/* Timeline */}
    <div className="timeline">
        <span className="current-time">{formatTime(currentTime)}</span>
        <div className="progress-bar-container">
        <div 
            className="progress-bar"
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
        />
        </div>
        <span className="total-time">{formatTime(duration)}</span>
    </div>

    {/* Volume Control */}
    <div className="volume-control">
        <button className="volume-icon">
        {volume === 0 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
        ) : volume < 50 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
            </svg>
        ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
        )}
        </button>
        <input 
        type="range"
        className="volume-slider"
        min="0"
        max="100"
        value={volume}
        onChange={handleVolumeChange}
        />
        </div>
    </div>
</div>
);
};

export default WaveformPlayer;