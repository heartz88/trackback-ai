import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
const WaveformPlayer = ({ audioUrl, height = 128, onReady, onPlay, onPause }) => {
const waveformRef  = useRef(null);
const wavesurfer   = useRef(null);

// Store callbacks in refs — so the effect never needs callbacks in its dep array
const onReadyRef  = useRef(onReady);
const onPlayRef   = useRef(onPlay);
const onPauseRef  = useRef(onPause);
useEffect(() => { onReadyRef.current  = onReady;  }, [onReady]);
useEffect(() => { onPlayRef.current   = onPlay;   }, [onPlay]);
useEffect(() => { onPauseRef.current  = onPause;  }, [onPause]);

const [isPlaying,    setIsPlaying]    = useState(false);
const [isLoading,    setIsLoading]    = useState(true);
const [currentTime,  setCurrentTime]  = useState(0);
const [duration,     setDuration]     = useState(0);
const [volume,       setVolume]       = useState(75);
const [isMuted,      setIsMuted]      = useState(false);
const prevVolume = useRef(75);

// ── Create / recreate WaveSurfer only when audioUrl or height changes ──
useEffect(() => {
if (!waveformRef.current || !audioUrl) return;

// Reset UI state for new track
setIsPlaying(false);
setIsLoading(true);
setCurrentTime(0);
setDuration(0);

const computedStyle  = getComputedStyle(document.documentElement);
const accentColor    = computedStyle.getPropertyValue('--accent-primary').trim()    || '#14B8A6';
const textSecondary  = computedStyle.getPropertyValue('--text-secondary').trim()    || '#cbd5e1';
const surfaceColor   = computedStyle.getPropertyValue('--surface-2').trim()         || 'rgba(255,255,255,0.06)';

const ws = WaveSurfer.create({
    container:     waveformRef.current,
    waveColor:     textSecondary,
    progressColor: accentColor,
    cursorColor:   accentColor,
    barWidth:      2,
    barRadius:     3,
    cursorWidth:   2,
    height:        height,
    barGap:        2,
    normalize:     true,
    backend:       'MediaElement',
    // Set volume at creation — fixes "no sound on first play"
    volume:        0.75,
});

wavesurfer.current = ws;

// Apply initial volume immediately after creation
ws.setVolume(0.75);

ws.load(audioUrl);

ws.on('ready', () => {
    setIsLoading(false);
    setDuration(ws.getDuration());
    // Re-apply volume after ready (some browsers reset it)
    ws.setVolume(prevVolume.current / 100);
    if (onReadyRef.current) onReadyRef.current();
});

ws.on('play', () => {
    setIsPlaying(true);
    if (onPlayRef.current) onPlayRef.current();
});

ws.on('pause', () => {
    setIsPlaying(false);
    if (onPauseRef.current) onPauseRef.current();
});

ws.on('finish', () => {
    setIsPlaying(false);
    if (onPauseRef.current) onPauseRef.current();
});

ws.on('audioprocess', () => {
    setCurrentTime(ws.getCurrentTime());
});

ws.on('seek', () => {
    setCurrentTime(ws.getCurrentTime());
});

ws.on('error', err => {
    console.error('WaveSurfer error:', err);
    setIsLoading(false);
});

return () => {
    ws.destroy();
};
// Only audioUrl and height should trigger recreation — NOT callbacks
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [audioUrl, height]);

const togglePlay = () => {
if (wavesurfer.current && !isLoading) {
    wavesurfer.current.playPause();
}
};

const handleVolumeChange = e => {
const val = parseInt(e.target.value);
setVolume(val);
prevVolume.current = val;
setIsMuted(val === 0);
if (wavesurfer.current) wavesurfer.current.setVolume(val / 100);
};

const toggleMute = () => {
if (!wavesurfer.current) return;
if (isMuted) {
    const restore = prevVolume.current || 75;
    setVolume(restore);
    setIsMuted(false);
    wavesurfer.current.setVolume(restore / 100);
} else {
    prevVolume.current = volume;
    setVolume(0);
    setIsMuted(true);
    wavesurfer.current.setVolume(0);
}
};

const handleProgressClick = e => {
if (!wavesurfer.current || !duration) return;
const rect = e.currentTarget.getBoundingClientRect();
const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
wavesurfer.current.seekTo(pct);
};

const formatTime = secs => {
const m = Math.floor(secs / 60);
const s = Math.floor(secs % 60);
return `${m}:${s.toString().padStart(2, '0')}`;
};

const progressPct = duration ? (currentTime / duration) * 100 : 0;

return (
<div className="waveform-player glass">

    {/* Waveform canvas */}
    <div className="waveform-section">
    <div ref={waveformRef} className={`waveform-canvas ${isLoading ? 'loading' : ''}`}/>
    </div>

    {/* Loading overlay */}
    {isLoading && (
    <div className="waveform-loading">
        <div className="music-loader">
        {[...Array(5)].map((_,i) => <div key={i} className="music-loader-bar"/>)}
        </div>
        <span style={{ color:'var(--text-secondary)', fontSize:13 }}>Loading audio…</span>
    </div>
    )}

    {/* Controls */}
    <div className="waveform-controls">

    {/* Play / Pause */}
    <button
        className="play-btn"
        onClick={togglePlay}
        disabled={isLoading}
        aria-label={isPlaying ? 'Pause' : 'Play'}
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
        <div className="progress-bar-container" onClick={handleProgressClick} role="slider"
        aria-label="Seek" aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{ width: `${progressPct}%` }}/>
        </div>
        <span className="total-time">{formatTime(duration)}</span>
    </div>

    {/* Volume */}
    <div className="volume-control">
        <button className="volume-icon" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
        {isMuted || volume === 0 ? (
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
        min="0" max="100"
        value={volume}
        onChange={handleVolumeChange}
        aria-label="Volume"
        />
    </div>
    </div>
</div>
);
};

export default WaveformPlayer;