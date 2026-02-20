import { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

// Expose analyser node so parent (TrackDetailPage) can use it for hero blobs
export let sharedAnalyser = null;
export let sharedAudioCtx = null;

const WaveformPlayer = ({ audioUrl, height = 128, onReady, onPlay, onPause, onAnalyserReady }) => {
const waveformRef = useRef(null);
const waveformWrapRef = useRef(null);
const oscCanvasRef = useRef(null);
const wavesurfer = useRef(null);
const analyserNode = useRef(null);
const audioCtx = useRef(null);
const animFrameRef = useRef(null);
const isPlayingRef = useRef(false);
const analyserConnected = useRef(false);

const [isPlaying, setIsPlaying] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [volume, setVolume] = useState(75);
const [beatScale, setBeatScale] = useState(1);

const lastBeatTime = useRef(0);
const energyHistory = useRef(new Array(43).fill(0));

const tryConnectAnalyser = useCallback(() => {
if (analyserConnected.current) return;
try {
    const ws = wavesurfer.current;
    if (!ws) return;
    const mediaEl = ws.getMediaElement();
    if (!mediaEl) return;

    if (!audioCtx.current) {
    audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ac = audioCtx.current;
    if (ac.state === 'suspended') ac.resume();

    const source = ac.createMediaElementSource(mediaEl);
    const analyser = ac.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;

    source.connect(analyser);
    analyser.connect(ac.destination);

    analyserNode.current = analyser;
    analyserConnected.current = true;

    // Share globally so TrackDetailPage hero can access
    sharedAnalyser = analyser;
    sharedAudioCtx = ac;

    if (onAnalyserReady) onAnalyserReady(analyser, ac);

    // Size canvas
    const canvas = oscCanvasRef.current;
    const wrap = waveformWrapRef.current;
    if (canvas && wrap) {
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
    }
} catch (e) {
    console.warn('WaveformPlayer: analyser connect failed:', e.message);
}
}, [onAnalyserReady]);

const drawOscilloscope = useCallback(() => {
const canvas = oscCanvasRef.current;
const analyser = analyserNode.current;
if (!canvas || !analyser) return;

const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const bufferLength = analyser.fftSize;
const dataArray = new Float32Array(bufferLength);
analyser.getFloatTimeDomainData(dataArray);

ctx.clearRect(0, 0, W, H);

// Beat detection for play button pulse
const freqData = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(freqData);
const bassEnd = Math.floor(freqData.length * 0.06);
let bassEnergy = 0;
for (let i = 0; i < bassEnd; i++) bassEnergy += freqData[i];
bassEnergy /= bassEnd;

energyHistory.current.push(bassEnergy);
energyHistory.current.shift();
const avgEnergy = energyHistory.current.reduce((a, b) => a + b, 0) / energyHistory.current.length;

const now = performance.now();
if (bassEnergy > avgEnergy * 1.45 && bassEnergy > 55 && now - lastBeatTime.current > 220) {
    lastBeatTime.current = now;
    setBeatScale(1.12);
    setTimeout(() => setBeatScale(1), 120);
}

// --- Oscilloscope line ---
const computedStyle = getComputedStyle(document.documentElement);
const accent = computedStyle.getPropertyValue('--accent-primary').trim() || '#14B8A6';

// Glow pass
ctx.shadowBlur = 18;
ctx.shadowColor = accent;
ctx.strokeStyle = accent;
ctx.lineWidth = 1.5;
ctx.globalAlpha = 0.35;
ctx.beginPath();

const sliceW = W / bufferLength;
let x = 0;
for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i];
    const y = H / 2 + v * (H * 0.42);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceW;
}
ctx.stroke();

// Crisp pass on top
ctx.shadowBlur = 6;
ctx.globalAlpha = 0.85;
ctx.lineWidth = 1.5;
ctx.beginPath();
x = 0;
for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i];
    const y = H / 2 + v * (H * 0.42);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceW;
}
ctx.stroke();

ctx.globalAlpha = 1;
ctx.shadowBlur = 0;

if (isPlayingRef.current) {
    animFrameRef.current = requestAnimationFrame(drawOscilloscope);
}
}, []);

const startVisualizer = useCallback(() => {
if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
animFrameRef.current = requestAnimationFrame(drawOscilloscope);
}, [drawOscilloscope]);

const stopVisualizer = useCallback(() => {
if (animFrameRef.current) {
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
}
const canvas = oscCanvasRef.current;
if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
});

wavesurfer.current.load(audioUrl);

wavesurfer.current.on('ready', () => {
    setIsLoading(false);
    setDuration(wavesurfer.current.getDuration());
    if (onReady) onReady();
});

wavesurfer.current.on('play', () => {
    isPlayingRef.current = true;
    setIsPlaying(true);
    tryConnectAnalyser();
    if (audioCtx.current?.state === 'suspended') audioCtx.current.resume();
    startVisualizer();
    if (onPlay) onPlay();
});

wavesurfer.current.on('pause', () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    stopVisualizer();
    if (onPause) onPause();
});

wavesurfer.current.on('finish', () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    stopVisualizer();
});

wavesurfer.current.on('audioprocess', () => {
    setCurrentTime(wavesurfer.current.getCurrentTime());
});

wavesurfer.current.on('seek', () => {
    setCurrentTime(wavesurfer.current.getCurrentTime());
});

const ro = new ResizeObserver(() => {
    const canvas = oscCanvasRef.current;
    const wrap = waveformWrapRef.current;
    if (canvas && wrap) {
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
    }
});
if (waveformWrapRef.current) ro.observe(waveformWrapRef.current);

return () => {
    isPlayingRef.current = false;
    stopVisualizer();
    ro.disconnect();
    if (wavesurfer.current) wavesurfer.current.destroy();
    if (audioCtx.current) {
    audioCtx.current.close();
    audioCtx.current = null;
    }
    sharedAnalyser = null;
    sharedAudioCtx = null;
    analyserConnected.current = false;
};
}, [audioUrl, height, onReady, onPlay, onPause, tryConnectAnalyser, startVisualizer, stopVisualizer]);

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
<div className="waveform-player glass">
    {/* Waveform + oscilloscope overlay */}
    <div ref={waveformWrapRef} style={{ position: 'relative', width: '100%' }}>
    <div
        ref={waveformRef}
        className={`waveform-canvas ${isLoading ? 'loading' : ''}`}
    />
    {/* Oscilloscope canvas overlaid on waveform */}
    <canvas
        ref={oscCanvasRef}
        style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: isPlaying ? 1 : 0,
        transition: 'opacity 0.6s ease',
        mixBlendMode: 'screen',
        }}
    />
    </div>

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
    <button
        className="play-btn"
        onClick={togglePlay}
        disabled={isLoading}
        style={{
        transform: `scale(${beatScale})`,
        transition: beatScale > 1
            ? 'transform 0.05s ease-out, box-shadow 0.05s ease-out'
            : 'transform 0.18s ease-in, box-shadow 0.18s ease-in',
        boxShadow: beatScale > 1
            ? '0 0 20px 6px var(--accent-primary, #14B8A6)'
            : undefined,
        }}
    >
        {isPlaying ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
        ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
        </svg>
        )}
    </button>

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

    <div className="volume-control">
        <button className="volume-icon">
        {volume === 0 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
        ) : volume < 50 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 9v6h4l5 5V4l-5 5H7z" />
            </svg>
        ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
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