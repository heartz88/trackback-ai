import { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

const WaveformPlayer = ({ audioUrl, height = 128, onReady, onPlay, onPause }) => {
const waveformRef = useRef(null);
const analyzerCanvasRef = useRef(null);
const wavesurfer = useRef(null);
const analyserNode = useRef(null);
const animFrameRef = useRef(null);
const isPlayingRef = useRef(false);

const [isPlaying, setIsPlaying] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [volume, setVolume] = useState(75);
const [beatFlash, setBeatFlash] = useState(false);

// Beat detection state (kept in refs to avoid re-render churn)
const lastBeatTime = useRef(0);
const beatThreshold = useRef(180); // adaptive threshold

const drawAnalyzer = useCallback(() => {
const canvas = analyzerCanvasRef.current;
const analyser = analyserNode.current;
if (!canvas || !analyser) return;

const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
analyser.getByteFrequencyData(dataArray);

ctx.clearRect(0, 0, W, H);

// --- Beat detection on bass bins (0–12 ≈ 20–300Hz) ---
let bassSum = 0;
for (let i = 0; i < 12; i++) bassSum += dataArray[i];
const bassAvg = bassSum / 12;

// Adaptive threshold drift
beatThreshold.current = beatThreshold.current * 0.98 + bassAvg * 0.02 + 20;

const now = performance.now();
if (bassAvg > beatThreshold.current && now - lastBeatTime.current > 250) {
    lastBeatTime.current = now;
    setBeatFlash(true);
    setTimeout(() => setBeatFlash(false), 120);
}

// --- Frequency bars ---
const computedStyle = getComputedStyle(document.documentElement);
const accentColor = computedStyle.getPropertyValue('--accent-primary').trim() || '#14B8A6';

// Number of bars to draw (skip ultra-high freqs)
const barCount = 64;
const step = Math.floor(bufferLength / barCount);
const barW = (W / barCount) - 1.5;

for (let i = 0; i < barCount; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) sum += dataArray[i * step + j];
    const value = sum / step;
    const barH = (value / 255) * H;

    // Color: bass bins glow brighter/warmer
    const isBass = i < 8;
    const alpha = 0.35 + (value / 255) * 0.65;

    if (isBass) {
    // Bass: accent color with stronger glow
    ctx.shadowBlur = bassAvg > 100 ? 12 : 4;
    ctx.shadowColor = accentColor;
    ctx.fillStyle = accentColor;
    } else {
    // Mids/highs: slightly desaturated
    ctx.shadowBlur = 0;
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = alpha * 0.7;
    }

    ctx.globalAlpha = alpha;
    const x = i * (barW + 1.5);
    // Draw bar from bottom up, mirrored (top + bottom)
    const yBottom = H / 2 + barH / 2;
    const yTop = H / 2 - barH / 2;
    ctx.beginPath();
    ctx.roundRect(x, yTop, barW, barH, 2);
    ctx.fill();
}

ctx.globalAlpha = 1;
ctx.shadowBlur = 0;

if (isPlayingRef.current) {
    animFrameRef.current = requestAnimationFrame(drawAnalyzer);
}
}, []);

const startAnalyzer = useCallback(() => {
if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
animFrameRef.current = requestAnimationFrame(drawAnalyzer);
}, [drawAnalyzer]);

const stopAnalyzer = useCallback(() => {
if (animFrameRef.current) {
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
}
// Fade out canvas
const canvas = analyzerCanvasRef.current;
if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
}, []);

// Resize canvas to match container
const resizeCanvas = useCallback(() => {
const canvas = analyzerCanvasRef.current;
if (!canvas) return;
const parent = canvas.parentElement;
if (parent) {
    canvas.width = parent.clientWidth;
    canvas.height = 56; // fixed analyzer height
}
}, []);

useEffect(() => {
if (!waveformRef.current) return;

const computedStyle = getComputedStyle(document.documentElement);
const accentColor = computedStyle.getPropertyValue('--accent-primary').trim() || '#14B8A6';
const textSecondary = computedStyle.getPropertyValue('--text-secondary').trim() || '#cbd5e1';

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

wavesurfer.current.load(audioUrl);

wavesurfer.current.on('ready', () => {
    setIsLoading(false);
    setDuration(wavesurfer.current.getDuration());

    // Hook into WaveSurfer's own AudioContext
    try {
    const backend = wavesurfer.current.backend;
    const ac = backend.ac;
    const analyser = ac.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;

    // Connect: source → analyser → destination
    backend.source?.connect(analyser);
    // Also connect analyser to destination so audio plays through
    analyser.connect(ac.destination);

    analyserNode.current = analyser;
    resizeCanvas();
    } catch (e) {
    console.warn('WaveformPlayer: Could not attach analyser node', e);
    }

    if (onReady) onReady();
});

wavesurfer.current.on('play', () => {
    isPlayingRef.current = true;
    setIsPlaying(true);
    startAnalyzer();
    if (onPlay) onPlay();
});

wavesurfer.current.on('pause', () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    stopAnalyzer();
    if (onPause) onPause();
});

wavesurfer.current.on('finish', () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    stopAnalyzer();
});

wavesurfer.current.on('audioprocess', () => {
    setCurrentTime(wavesurfer.current.getCurrentTime());
});

wavesurfer.current.on('seek', () => {
    setCurrentTime(wavesurfer.current.getCurrentTime());
});

const ro = new ResizeObserver(resizeCanvas);
if (waveformRef.current) ro.observe(waveformRef.current);

return () => {
    isPlayingRef.current = false;
    stopAnalyzer();
    ro.disconnect();
    if (wavesurfer.current) wavesurfer.current.destroy();
};
}, [audioUrl, height, onReady, onPlay, onPause, startAnalyzer, stopAnalyzer, resizeCanvas]);

const togglePlay = () => {
if (wavesurfer.current) wavesurfer.current.playPause();
};

const handleVolumeChange = (e) => {
const newVolume = parseInt(e.target.value);
setVolume(newVolume);
if (wavesurfer.current) wavesurfer.current.setVolume(newVolume / 100);
};

const formatTime = (seconds) => {
const mins = Math.floor(seconds / 60);
const secs = Math.floor(seconds % 60);
return `${mins}:${secs.toString().padStart(2, '0')}`;
};

return (
<div className={`waveform-player glass${beatFlash ? ' beat-flash' : ''}`}>
    {/* Beat-reactive frequency analyzer */}
    <div
    className="analyzer-container"
    style={{
        position: 'relative',
        width: '100%',
        height: 56,
        marginBottom: 4,
        opacity: isPlaying ? 1 : 0.25,
        transition: 'opacity 0.4s ease',
    }}
    >
    <canvas
        ref={analyzerCanvasRef}
        style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        borderRadius: 8,
        }}
    />
    {/* Subtle gradient overlay so it blends with the glass panel */}
    <div
        style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, transparent 60%, var(--bg-secondary, rgba(0,0,0,0.3)) 100%)',
        borderRadius: 8,
        pointerEvents: 'none',
        }}
    />
    </div>

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
    {/* Play/Pause Button — pulses on beat */}
    <button
        className={`play-btn${beatFlash && isPlaying ? ' beat-pulse' : ''}`}
        onClick={togglePlay}
        disabled={isLoading}
        style={{
        transition: 'transform 0.08s ease, box-shadow 0.08s ease',
        transform: beatFlash && isPlaying ? 'scale(1.12)' : 'scale(1)',
        boxShadow: beatFlash && isPlaying
            ? '0 0 18px 4px var(--accent-primary, #14B8A6)'
            : undefined,
        }}
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