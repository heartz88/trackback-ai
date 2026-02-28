import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { useEffect, useRef, useState } from 'react';

const WaveformPlayer = ({ audioUrl, height = 80, onReady, onPlay, onPause }) => {
const containerRef  = useRef(null);
const canvasRef     = useRef(null);   // grey base waveform
const progressRef   = useRef(null);   // teal progress overlay
const spectrumRef   = useRef(null);   // audioMotion container
const audioRef      = useRef(null);   // <audio> element
const audioMotion   = useRef(null);
const animFrame     = useRef(null);
const peaksRef      = useRef(null);

const onReadyRef = useRef(onReady);
const onPlayRef  = useRef(onPlay);
const onPauseRef = useRef(onPause);
useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
useEffect(() => { onPlayRef.current  = onPlay;  }, [onPlay]);
useEffect(() => { onPauseRef.current = onPause; }, [onPause]);

const [isPlaying,   setIsPlaying]   = useState(false);
const [isLoading,   setIsLoading]   = useState(true);
const [currentTime, setCurrentTime] = useState(0);
const [duration,    setDuration]    = useState(0);
const [volume,      setVolume]      = useState(75);
const [isMuted,     setIsMuted]     = useState(false);
const [fetchFailed, setFetchFailed] = useState(false);
const prevVolume = useRef(75);

// ── Draw waveform bars onto both canvas layers ──────────────────────────
const drawWaveform = (peaks, progress = 0) => {
const canvas  = canvasRef.current;
const overlay = progressRef.current;
if (!canvas || !overlay || !peaks) return;

const W    = canvas.width;
const H    = canvas.height;
const mid  = H / 2;
const barW = 3;
const gap  = 1;
const step = barW + gap;
const bars = Math.floor(W / step);

// Grey base layer
const ctx = canvas.getContext('2d');
ctx.clearRect(0, 0, W, H);
ctx.fillStyle = 'rgba(148,163,184,0.35)';
for (let i = 0; i < bars; i++) {
    const idx  = Math.floor((i / bars) * peaks.length);
    const amp  = Math.max(peaks[idx] || 0, 0.02);
    const barH = amp * mid;
    const x    = i * step;
    ctx.beginPath();
    ctx.roundRect(x, mid - barH, barW, barH * 2, 2);
    ctx.fill();
}

// Teal progress overlay (clipped to progress %)
const octx = overlay.getContext('2d');
octx.clearRect(0, 0, W, H);
const progressX = progress * W;
octx.save();
octx.beginPath();
octx.rect(0, 0, progressX, H);
octx.clip();
octx.fillStyle = '#14B8A6';
for (let i = 0; i < bars; i++) {
    const idx  = Math.floor((i / bars) * peaks.length);
    const amp  = Math.max(peaks[idx] || 0, 0.02);
    const barH = amp * mid;
    const x    = i * step;
    octx.beginPath();
    octx.roundRect(x, mid - barH, barW, barH * 2, 2);
    octx.fill();
}
octx.restore();
};

// ── Generate a synthetic waveform when fetch/decode fails (CORS) ─────────
const makeSyntheticPeaks = (count = 2000) => {
const peaks = new Float32Array(count);
for (let i = 0; i < count; i++) {
    // Sine envelope with some noise — looks like a real track
    const t     = i / count;
    const env   = Math.sin(Math.PI * t);         // fade in/out
    const wave  = Math.abs(Math.sin(t * 60))     // fast oscillation
                + Math.abs(Math.sin(t * 23 + 1)) // harmonics
                + Math.random() * 0.3;            // noise
    peaks[i] = Math.min(1, env * wave * 0.55);
}
// Normalise
const max = Math.max(...peaks);
if (max > 0) for (let i = 0; i < count; i++) peaks[i] /= max;
return peaks;
};

// ── Resize both canvases to fill container ───────────────────────────────
const resizeCanvases = () => {
const wrap = canvasRef.current?.parentElement;
if (!wrap) return;
const W   = wrap.getBoundingClientRect().width;
if (W <= 0) return;
const dpr = window.devicePixelRatio || 1;

[canvasRef.current, progressRef.current].forEach(c => {
    if (!c) return;
    c.width        = W * dpr;
    c.height       = height * dpr;
    c.style.width  = W + 'px';
    c.style.height = height + 'px';
    c.getContext('2d').scale(dpr, dpr);
});

if (peaksRef.current) {
    const prog = audioRef.current && duration
    ? audioRef.current.currentTime / duration : 0;
    drawWaveform(peaksRef.current, prog);
}

if (audioMotion.current && spectrumRef.current) {
    try { audioMotion.current.width = spectrumRef.current.getBoundingClientRect().width; } catch {}
}
};

// ── 60fps loop for smooth progress bar ──────────────────────────────────
const startLoop = () => {
const tick = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const d = audio.duration || 0;
    setCurrentTime(t);
    if (peaksRef.current && d > 0) drawWaveform(peaksRef.current, t / d);
    animFrame.current = requestAnimationFrame(tick);
};
animFrame.current = requestAnimationFrame(tick);
};
const stopLoop = () => {
if (animFrame.current) { cancelAnimationFrame(animFrame.current); animFrame.current = null; }
};

// ── Init audioMotion ─────────────────────────────────────────────────────
const initAudioMotion = (audioEl) => {
if (!spectrumRef.current) return;
try {
    if (audioMotion.current) { try { audioMotion.current.destroy(); } catch {} audioMotion.current = null; }
    const w = spectrumRef.current.getBoundingClientRect().width || 800;
    audioMotion.current = new AudioMotionAnalyzer(spectrumRef.current, {
    source:        audioEl,
    mode:          10,
    gradient:      'rainbow',
    showBgColor:   true,
    bgAlpha:       0,
    overlay:       true,
    showScaleX:    false,
    showScaleY:    false,
    reflexRatio:   0.4,
    reflexAlpha:   0.25,
    reflexFit:     true,
    barSpace:      0.25,
    smoothing:     0.75,
    minFreq:       30,
    maxFreq:       20000,
    channelLayout: 'single',
    width:         w,
    height:        150,
    });
} catch (e) { console.warn('audioMotion failed:', e); }
};

// ── Finalise after peaks are ready ──────────────────────────────────────
const finishSetup = (peaks, audioDuration) => {
peaksRef.current = peaks;
// Double rAF ensures layout is complete before measuring canvas width
requestAnimationFrame(() => requestAnimationFrame(() => {
    resizeCanvases();
    drawWaveform(peaks, 0);
    setIsLoading(false);
    if (audioDuration) setDuration(audioDuration);
    if (onReadyRef.current) onReadyRef.current();
}));
};

// ── Main effect ──────────────────────────────────────────────────────────
useEffect(() => {
if (!audioUrl) return;

setIsPlaying(false);
setIsLoading(true);
setFetchFailed(false);
setCurrentTime(0);
setDuration(0);
peaksRef.current = null;
stopLoop();

// Create <audio> element for playback
const audio       = new Audio();
audio.crossOrigin = 'anonymous';
audio.src         = audioUrl;
audio.volume      = 0.75;
audioRef.current  = audio;

// Wire audioMotion immediately — it only shows when audio plays
requestAnimationFrame(() => initAudioMotion(audio));

// Try to decode audio for real waveform peaks
// Falls back to synthetic peaks if CORS blocks the fetch
const ac = new (window.AudioContext || window.webkitAudioContext)();

fetch(audioUrl, { mode: 'cors' })
    .then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.arrayBuffer();
    })
    .then(buf => ac.decodeAudioData(buf))
    .then(decoded => {
    const raw   = decoded.getChannelData(0);
    const count = 2000;
    const block = Math.floor(raw.length / count);
    const peaks = new Float32Array(count);
    let max = 0;
    for (let i = 0; i < count; i++) {
        let sum = 0;
        for (let j = 0; j < block; j++) sum += Math.abs(raw[i * block + j]);
        peaks[i] = sum / block;
        if (peaks[i] > max) max = peaks[i];
    }
    if (max > 0) for (let i = 0; i < count; i++) peaks[i] /= max;
    finishSetup(peaks, decoded.duration);
    try { ac.close(); } catch {}
    })
    .catch(err => {
    // CORS or decode error — use synthetic waveform so UI still works
    console.warn('Waveform decode failed (likely CORS), using synthetic peaks:', err);
    setFetchFailed(true);
    const synth = makeSyntheticPeaks();
    // Use audio element's duration once it loads
    const setDurAndDraw = () => finishSetup(synth, audio.duration);
    if (audio.readyState >= 1) {
        setDurAndDraw();
    } else {
        audio.addEventListener('loadedmetadata', setDurAndDraw, { once: true });
    }
    try { ac.close(); } catch {}
    });

// Audio element events
audio.addEventListener('play',   () => { setIsPlaying(true);  startLoop();  if (onPlayRef.current)  onPlayRef.current();  });
audio.addEventListener('pause',  () => { setIsPlaying(false); stopLoop();   if (onPauseRef.current) onPauseRef.current(); });
audio.addEventListener('ended',  () => {
    setIsPlaying(false); stopLoop(); setCurrentTime(0);
    if (peaksRef.current) drawWaveform(peaksRef.current, 0);
    if (onPauseRef.current) onPauseRef.current();
});
audio.addEventListener('durationchange', () => setDuration(audio.duration));
audio.addEventListener('error', () => setIsLoading(false));

return () => {
    stopLoop();
    audio.pause();
    audio.src = '';
    if (audioMotion.current) { try { audioMotion.current.destroy(); } catch {} audioMotion.current = null; }
    try { ac.close(); } catch {}
};
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [audioUrl]);

// ── ResizeObserver ───────────────────────────────────────────────────────
useEffect(() => {
const ro = new ResizeObserver(() => resizeCanvases());
if (containerRef.current) ro.observe(containerRef.current);
return () => ro.disconnect();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// ── Seek on waveform click ───────────────────────────────────────────────
const handleWaveformClick = e => {
const audio = audioRef.current;
if (!audio || !duration) return;
const rect = e.currentTarget.getBoundingClientRect();
const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
audio.currentTime = pct * duration;
setCurrentTime(pct * duration);
if (peaksRef.current) drawWaveform(peaksRef.current, pct);
};

const handleProgressClick = e => {
const audio = audioRef.current;
if (!audio || !duration) return;
const rect = e.currentTarget.getBoundingClientRect();
const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
audio.currentTime = pct * duration;
setCurrentTime(pct * duration);
if (peaksRef.current) drawWaveform(peaksRef.current, pct);
};

const togglePlay = () => {
const audio = audioRef.current;
if (!audio) return;
isPlaying ? audio.pause() : audio.play();
};

const handleVolumeChange = e => {
const val = parseInt(e.target.value);
setVolume(val); prevVolume.current = val; setIsMuted(val === 0);
if (audioRef.current) audioRef.current.volume = val / 100;
};

const toggleMute = () => {
const audio = audioRef.current;
if (!audio) return;
if (isMuted) {
    const r = prevVolume.current || 75;
    setVolume(r); setIsMuted(false); audio.volume = r / 100;
} else {
    prevVolume.current = volume; setVolume(0); setIsMuted(true); audio.volume = 0;
}
};

const formatTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const progressPct = duration ? (currentTime / duration) * 100 : 0;

return (
<div ref={containerRef} className="waveform-player glass">

    {/* Rainbow spectrum */}
    <div ref={spectrumRef} className="audiomotion-container" />

    {/* Custom waveform — two stacked canvases */}
    <div
    className="waveform-section"
    onClick={handleWaveformClick}
    style={{ cursor:'pointer', position:'relative', userSelect:'none' }}
    >
    {/* Base: grey bars */}
    <canvas ref={canvasRef} style={{ display:'block', width:'100%' }} />
    {/* Overlay: teal progress clip */}
    <canvas ref={progressRef} style={{
        display:'block', width:'100%',
        position:'absolute', top:0, left:0, pointerEvents:'none'
    }} />
    {/* Subtle indicator when using synthetic waveform */}
    {fetchFailed && (
        <span style={{
        position:'absolute', bottom:4, right:8,
        fontSize:10, color:'rgba(148,163,184,0.4)',
        pointerEvents:'none', userSelect:'none',
        }}>
        ≈ estimated
        </span>
    )}
    </div>

    {isLoading && (
    <div className="waveform-loading">
        <div className="music-loader">
        {[...Array(5)].map((_,i) => <div key={i} className="music-loader-bar"/>)}
        </div>
        <span style={{ color:'var(--text-secondary)', fontSize:13 }}>Loading audio…</span>
    </div>
    )}

    <div className="waveform-controls">
    <button className="play-btn" onClick={togglePlay} disabled={isLoading}
        aria-label={isPlaying ? 'Pause' : 'Play'}>
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

    <div className="timeline">
        <span className="current-time">{formatTime(currentTime)}</span>
        <div className="progress-bar-container" onClick={handleProgressClick}
        role="slider" aria-label="Seek"
        aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{ width:`${progressPct}%` }}/>
        </div>
        <span className="total-time">{formatTime(duration)}</span>
    </div>

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
        <input type="range" className="volume-slider" min="0" max="100"
        value={volume} onChange={handleVolumeChange} aria-label="Volume"/>
    </div>
    </div>
</div>
);
};

export default WaveformPlayer;