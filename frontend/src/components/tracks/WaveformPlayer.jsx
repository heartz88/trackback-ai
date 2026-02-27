import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

const WaveformPlayer = ({ audioUrl, height = 100, onReady, onPlay, onPause }) => {
const playerRef    = useRef(null);   // outer wrapper — we measure THIS for true pixel width
const waveformRef  = useRef(null);   // WaveSurfer mounts here
const spectrumRef  = useRef(null);   // audioMotion mounts here
const wavesurfer   = useRef(null);
const audioMotion  = useRef(null);
const initTimers   = useRef([]);
const roRef        = useRef(null);
const wsWidth      = useRef(0);      // last width WaveSurfer was created with

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
const prevVolume = useRef(75);

// ── Measure true inner width of the player ────────────────────────────────
// Reads the outer playerRef, subtracts computed padding so we get the exact
// pixel space available for the waveform canvas.
const getInnerWidth = () => {
if (!playerRef.current) return 0;
const style   = getComputedStyle(playerRef.current);
const padding = parseFloat(style.paddingLeft || 0) + parseFloat(style.paddingRight || 0);
return Math.floor(playerRef.current.offsetWidth - padding);
};

// ── Destroy and fully recreate WaveSurfer at a specific pixel width ───────
const buildWaveSurfer = (pixelWidth, audioUrlToBuild, isDestroyedRef) => {
if (!waveformRef.current || pixelWidth < 10) return;

// Tear down previous instance
if (wavesurfer.current) {
    try { wavesurfer.current.destroy(); } catch {}
    wavesurfer.current = null;
}
if (audioMotion.current) {
    try { audioMotion.current.destroy(); } catch {}
    audioMotion.current = null;
}

wsWidth.current = pixelWidth;

const computedStyle = getComputedStyle(document.documentElement);
const accentColor   = computedStyle.getPropertyValue('--accent-primary').trim() || '#14B8A6';
const textSecondary = computedStyle.getPropertyValue('--text-secondary').trim() || '#94a3b8';

// Force the waveform div to exactly this pixel width so WaveSurfer
// measures it correctly — no CSS percentage ambiguity
if (waveformRef.current) {
    waveformRef.current.style.width  = `${pixelWidth}px`;
    waveformRef.current.style.minWidth = `${pixelWidth}px`;
    waveformRef.current.style.maxWidth = `${pixelWidth}px`;
}

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
    fillParent:    false,     // we're passing exact pixels — don't let it guess
    minPxPerSec:   0,
    interact:      true,
    backend:       'MediaElement',
    volume:        0.75,
});

wavesurfer.current = ws;
ws.setVolume(0.75);
ws.load(audioUrlToBuild);

ws.on('ready', () => {
    if (isDestroyedRef.current) return;
    setIsLoading(false);
    setDuration(ws.getDuration());
    ws.setVolume(prevVolume.current / 100);
    if (onReadyRef.current) onReadyRef.current();

    // One final redraw to make sure bars fill the exact width
    try { ws.drawBuffer(); } catch {}
    setTimeout(() => { try { if (!ws.isDestroyed) ws.drawBuffer(); } catch {} }, 100);

    // Connect audioMotion to the same MediaElement
    const mediaEl = ws.backend?.media || ws.getMediaElement?.();
    if (mediaEl && spectrumRef.current) {
    try {
        audioMotion.current = new AudioMotionAnalyzer(spectrumRef.current, {
        source:        mediaEl,
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
        barSpace:      0.3,
        smoothing:     0.75,
        minFreq:       30,
        maxFreq:       20000,
        channelLayout: 'single',
        height:        140,
        width:         pixelWidth,   // exact same pixel width
        });
    } catch (err) {
        console.warn('audioMotion init failed:', err);
    }
    }
});

ws.on('play',         () => { setIsPlaying(true);  if (onPlayRef.current)  onPlayRef.current();  });
ws.on('pause',        () => { setIsPlaying(false); if (onPauseRef.current) onPauseRef.current(); });
ws.on('finish',       () => { setIsPlaying(false); if (onPauseRef.current) onPauseRef.current(); });
ws.on('audioprocess', () => setCurrentTime(ws.getCurrentTime()));
ws.on('seek',         () => setCurrentTime(ws.getCurrentTime()));
ws.on('error',        err => { console.error('WaveSurfer error:', err); setIsLoading(false); });
};

// ── Main effect ────────────────────────────────────────────────────────────
useEffect(() => {
if (!waveformRef.current || !audioUrl) return;

setIsPlaying(false);
setIsLoading(true);
setCurrentTime(0);
setDuration(0);

const isDestroyedRef = { current: false };

// Wait until the player has a real measured width, then build
const tryBuild = () => {
    if (isDestroyedRef.current) return;
    const w = getInnerWidth();
    if (w < 10) {
    requestAnimationFrame(tryBuild);
    return;
    }
    buildWaveSurfer(w, audioUrl, isDestroyedRef);
};

tryBuild();

// ResizeObserver on the OUTER player div — if it changes width,
// rebuild WaveSurfer at the new exact pixel width
const ro = new ResizeObserver(() => {
    const newW = getInnerWidth();
    // Only rebuild if width changed by more than 2px (avoids thrash from scrollbars)
    if (Math.abs(newW - wsWidth.current) > 2 && newW > 10) {
    const prevTime = wavesurfer.current?.getCurrentTime?.() || 0;
    const wasPlaying = wavesurfer.current?.isPlaying?.() || false;
    buildWaveSurfer(newW, audioUrl, isDestroyedRef);
    // Restore position after rebuild
    wavesurfer.current?.on('ready', () => {
        if (prevTime > 0) try { wavesurfer.current.seekTo(prevTime / wavesurfer.current.getDuration()); } catch {}
        if (wasPlaying) try { wavesurfer.current.play(); } catch {}
    });
    }
    // Always resize audioMotion
    if (audioMotion.current && spectrumRef.current) {
    try { audioMotion.current.width = newW; } catch {}
    }
});

if (playerRef.current) ro.observe(playerRef.current);
roRef.current = ro;

return () => {
    isDestroyedRef.current = true;
    initTimers.current.forEach(clearTimeout);
    initTimers.current = [];
    ro.disconnect();
    if (audioMotion.current) { try { audioMotion.current.destroy(); } catch {} audioMotion.current = null; }
    if (wavesurfer.current)  { try { wavesurfer.current.destroy();  } catch {} wavesurfer.current  = null; }
};
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [audioUrl, height]);

// ── Window resize → update audioMotion width ──────────────────────────────
useEffect(() => {
const handleResize = () => {
    if (audioMotion.current && spectrumRef.current) {
    try { audioMotion.current.width = getInnerWidth(); } catch {}
    }
};
window.addEventListener('resize', handleResize);
return () => window.removeEventListener('resize', handleResize);
}, []);

const togglePlay = () => {
if (wavesurfer.current && !isLoading) wavesurfer.current.playPause();
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
// playerRef on the outermost div — this is what we measure
<div ref={playerRef} className="waveform-player glass">

    {/* Rainbow spectrum — same pixel width as waveform */}
    <div
    ref={spectrumRef}
    className="audiomotion-container"
    style={{ width: '100%', height: 140, background: 'transparent' }}
    />

    {/* WaveSurfer container — width set in JS, not CSS */}
    <div style={{ width: '100%', padding: 0, margin: 0, overflow: 'hidden' }}>
    <div
        ref={waveformRef}
        style={{ display: 'block', overflow: 'hidden' }}
    />
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

    <div className="timeline">
        <span className="current-time">{formatTime(currentTime)}</span>
        <div
        className="progress-bar-container"
        onClick={handleProgressClick}
        role="slider"
        aria-label="Seek"
        aria-valuenow={Math.round(progressPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        >
        <div className="progress-bar" style={{ width: `${progressPct}%` }}/>
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