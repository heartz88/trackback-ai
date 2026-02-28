import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { useEffect, useRef, useState } from 'react';


const WaveformPlayer = ({ audioUrl, height = 80, onReady, onPlay, onPause }) => {
const containerRef = useRef(null);
const canvasRef    = useRef(null);   // single canvas for everything
const spectrumRef  = useRef(null);
const audioRef     = useRef(null);
const audioMotion  = useRef(null);
const animFrame    = useRef(null);
const peaksRef     = useRef(null);
const drawnWidth   = useRef(0);

const onReadyRef = useRef(onReady);
const onPlayRef  = useRef(onPlay);
const onPauseRef = useRef(onPause);
useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
useEffect(() => { onPlayRef.current  = onPlay;  }, [onPlay]);
useEffect(() => { onPauseRef.current = onPause; }, [onPause]);

const [isPlaying,  setIsPlaying]  = useState(false);
const [isLoading,  setIsLoading]  = useState(true);
const [currentTime,setCurrentTime]= useState(0);
const [duration,   setDuration]   = useState(0);
const [volume,     setVolume]     = useState(75);
const [isMuted,    setIsMuted]    = useState(false);
const [usingSynth, setUsingSynth] = useState(false);
const prevVolume = useRef(75);

// ── Single-canvas draw ───────────────────────────────────────────────────
// All coordinates are in CSS pixels. DPR scaling is applied via setTransform
// at the start of each draw call so it never accumulates.
const drawWaveform = (peaks, progress = 0) => {
const canvas = canvasRef.current;
if (!canvas || !peaks) return;

const dpr = window.devicePixelRatio || 1;
// CSS pixel dimensions
const W = canvas.width  / dpr;
const H = canvas.height / dpr;
if (W < 10 || H < 4) return;

const ctx = canvas.getContext('2d');
// Reset transform to identity then apply dpr scale — never accumulates
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
ctx.clearRect(0, 0, W, H);

const mid  = H / 2;
const barW = 3;
const gap  = 1;
const step = barW + gap;
const bars = Math.floor(W / step);

// ── Pass 1: all bars in grey ──
ctx.fillStyle = 'rgba(148,163,184,0.35)';
for (let i = 0; i < bars; i++) {
    const amp  = Math.max(peaks[Math.floor((i / bars) * peaks.length)] || 0, 0.025);
    const barH = amp * mid * 0.92;
    ctx.beginPath();
    ctx.roundRect(i * step, mid - barH, barW, barH * 2, 2);
    ctx.fill();
}

// ── Pass 2: bars to the left of playhead in teal (clipped) ──
const progressX = progress * W;
if (progressX > 1) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, progressX, H);
    ctx.clip();
    ctx.fillStyle = '#14B8A6';
    for (let i = 0; i < bars; i++) {
    const amp  = Math.max(peaks[Math.floor((i / bars) * peaks.length)] || 0, 0.025);
    const barH = amp * mid * 0.92;
    ctx.beginPath();
    ctx.roundRect(i * step, mid - barH, barW, barH * 2, 2);
    ctx.fill();
    }
    ctx.restore();
}
};

// ── Synthetic peaks for CORS fallback ───────────────────────────────────
const makeSyntheticPeaks = (count = 2000) => {
const peaks = new Float32Array(count);
for (let i = 0; i < count; i++) {
    const t  = i / count;
    peaks[i] = Math.min(1,
    Math.sin(Math.PI * t) *
    (Math.abs(Math.sin(t * 60)) + Math.abs(Math.sin(t * 23 + 1)) + Math.random() * 0.3) * 0.55
    );
}
const max = Math.max(...peaks);
if (max > 0) for (let i = 0; i < count; i++) peaks[i] /= max;
return peaks;
};

// ── Size canvas to container width ──────────────────────────────────────
const resizeCanvas = (callback) => {
const container = containerRef.current;
const canvas    = canvasRef.current;
if (!container || !canvas) return;

const attempt = (tries = 0) => {
    const W = container.getBoundingClientRect().width;
    if (W <= 10 && tries < 10) {
    setTimeout(() => attempt(tries + 1), 30 * (tries + 1));
    return;
    }
    if (W <= 10) return;

    const dpr    = window.devicePixelRatio || 1;
    canvas.width        = Math.round(W * dpr);
    canvas.height       = Math.round(height * dpr);
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${height}px`;
    drawnWidth.current  = W;

    if (peaksRef.current) {
    const prog = audioRef.current
        ? audioRef.current.currentTime / (audioRef.current.duration || 1) : 0;
    drawWaveform(peaksRef.current, prog);
    }

    if (audioMotion.current && spectrumRef.current) {
    try { audioMotion.current.width = spectrumRef.current.getBoundingClientRect().width; } catch {}
    }

    if (callback) callback();
};

attempt();
};

// ── 60fps loop ───────────────────────────────────────────────────────────
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

// ── audioMotion ──────────────────────────────────────────────────────────
const initAudioMotion = (audioEl) => {
if (!spectrumRef.current) return;
try {
    if (audioMotion.current) { try { audioMotion.current.destroy(); } catch {} audioMotion.current = null; }
    const w = spectrumRef.current.getBoundingClientRect().width
            || containerRef.current?.getBoundingClientRect().width
            || 800;
    audioMotion.current = new AudioMotionAnalyzer(spectrumRef.current, {
    source: audioEl, mode: 10, gradient: 'rainbow',
    showBgColor: true, bgAlpha: 0, overlay: true,
    showScaleX: false, showScaleY: false,
    reflexRatio: 0.4, reflexAlpha: 0.25, reflexFit: true,
    barSpace: 0.25, smoothing: 0.75,
    minFreq: 30, maxFreq: 20000,
    channelLayout: 'single', width: w, height: 150,
    });
} catch (e) { console.warn('audioMotion failed:', e); }
};

const finishSetup = (peaks, dur) => {
peaksRef.current = peaks;
resizeCanvas(() => {
    drawWaveform(peaks, 0);
    setIsLoading(false);
    if (dur) setDuration(dur);
    if (onReadyRef.current) onReadyRef.current();
});
};

// ── Main effect ──────────────────────────────────────────────────────────
useEffect(() => {
if (!audioUrl) return;

setIsPlaying(false);
setIsLoading(true);
setUsingSynth(false);
setCurrentTime(0);
setDuration(0);
peaksRef.current   = null;
drawnWidth.current = 0;
stopLoop();

const audio = new Audio();
audio.crossOrigin = 'anonymous';
audio.src    = audioUrl;
audio.volume = 0.75;
audioRef.current = audio;

setTimeout(() => initAudioMotion(audio), 50);

const ac = new (window.AudioContext || window.webkitAudioContext)();

fetch(audioUrl, { mode: 'cors' })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
    .then(buf => ac.decodeAudioData(buf))
    .then(decoded => {
    const raw = decoded.getChannelData(0);
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
    console.warn('Waveform decode failed (likely CORS) — using synthetic:', err);
    setUsingSynth(true);
    const synth = makeSyntheticPeaks();
    const go = () => finishSetup(synth, audio.duration || 0);
    if (audio.readyState >= 1) go();
    else audio.addEventListener('loadedmetadata', go, { once: true });
    setTimeout(() => { if (isLoading) go(); }, 3000);
    try { ac.close(); } catch {}
    });

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
    audio.pause(); audio.src = '';
    if (audioMotion.current) { try { audioMotion.current.destroy(); } catch {} audioMotion.current = null; }
    try { ac.close(); } catch {}
};
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [audioUrl]);

// ── ResizeObserver ───────────────────────────────────────────────────────
useEffect(() => {
const ro = new ResizeObserver(() => {
    const W = containerRef.current?.getBoundingClientRect().width || 0;
    if (Math.abs(W - drawnWidth.current) > 2) resizeCanvas();
});
if (containerRef.current) ro.observe(containerRef.current);
return () => ro.disconnect();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// ── Controls ─────────────────────────────────────────────────────────────
const seek = pct => {
const audio = audioRef.current;
if (!audio || !duration) return;
const c = Math.max(0, Math.min(1, pct));
audio.currentTime = c * duration;
setCurrentTime(c * duration);
if (peaksRef.current) drawWaveform(peaksRef.current, c);
};

const handleWaveformClick = e => {
const rect = e.currentTarget.getBoundingClientRect();
seek((e.clientX - rect.left) / rect.width);
};

const handleProgressClick = e => {
const rect = e.currentTarget.getBoundingClientRect();
seek((e.clientX - rect.left) / rect.width);
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

const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const pct = duration ? (currentTime / duration) * 100 : 0;

return (
<div ref={containerRef} className="waveform-player glass">

    {/* Rainbow spectrum */}
    <div ref={spectrumRef} className="audiomotion-container" />

    {/* Single canvas — click anywhere to seek */}
    <div
    className="waveform-section"
    onClick={handleWaveformClick}
    style={{ position: 'relative', cursor: 'pointer', userSelect: 'none', lineHeight: 0 }}
    >
    <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: `${height}px` }}
    />
    {usingSynth && (
        <span style={{
        position: 'absolute', bottom: 4, right: 8,
        fontSize: 10, color: 'rgba(148,163,184,0.35)', pointerEvents: 'none',
        }}>≈ estimated</span>
    )}
    </div>

    {isLoading && (
    <div className="waveform-loading">
        <div className="music-loader">
        {[...Array(5)].map((_,i) => <div key={i} className="music-loader-bar"/>)}
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading audio…</span>
    </div>
    )}

    <div className="waveform-controls">
    <button className="play-btn" onClick={togglePlay} disabled={isLoading}
        aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying
        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        }
    </button>

    {/* Seek bar — teal fill + draggable thumb */}
    <div className="timeline">
        <span className="current-time">{fmt(currentTime)}</span>
        <div
        className="progress-bar-container"
        onClick={handleProgressClick}
        role="slider"
        aria-label="Seek"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ cursor: 'pointer', position: 'relative' }}
        >
        {/* Filled teal track */}
        <div className="progress-bar" style={{ width: `${pct}%` }} />
        {/* Thumb dot — only show when audio is loaded */}
        {duration > 0 && (
            <div style={{
            position: 'absolute',
            left: `clamp(6px, ${pct}%, calc(100% - 6px))`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 12, height: 12,
            borderRadius: '50%',
            background: 'var(--accent-primary, #14B8A6)',
            boxShadow: '0 0 0 3px rgba(20,184,166,0.3)',
            pointerEvents: 'none',
            zIndex: 2,
            }} />
        )}
        </div>
        <span className="total-time">{fmt(duration)}</span>
    </div>

    <div className="volume-control">
        <button className="volume-icon" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
        {isMuted || volume === 0
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            : volume < 50
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 9v6h4l5 5V4l-5 5H7z"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
        }
        </button>
        <input type="range" className="volume-slider" min="0" max="100"
        value={volume} onChange={handleVolumeChange} aria-label="Volume"/>
    </div>
    </div>
</div>
);
};

export default WaveformPlayer;