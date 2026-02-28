import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

/**
 * WaveformPlayer — fixed:
 * 1. Full width on all screen sizes: load audio AFTER layout settles (double rAF),
 *    ResizeObserver keeps both visualisers correct when window resizes.
 * 2. Progress bar follows audio in real time: requestAnimationFrame loop
 *    gives smooth 60fps updates (WaveSurfer's audioprocess only fires ~4x/sec).
 * 3. Callbacks stored in refs so WaveSurfer is never recreated on re-renders.
 * 4. audioMotion connected to same <audio> element — spectrum is live.
 */
const WaveformPlayer = ({ audioUrl, height = 100, onReady, onPlay, onPause }) => {
const waveformRef  = useRef(null);
const spectrumRef  = useRef(null);
const wavesurfer   = useRef(null);
const audioMotion  = useRef(null);
const animFrame    = useRef(null);

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

// 60fps progress bar via rAF — much smoother than WaveSurfer's audioprocess
const startTimeLoop = (ws) => {
const tick = () => {
    if (ws && !ws.isDestroyed) {
    setCurrentTime(ws.getCurrentTime());
    animFrame.current = requestAnimationFrame(tick);
    }
};
animFrame.current = requestAnimationFrame(tick);
};
const stopTimeLoop = () => {
if (animFrame.current) { cancelAnimationFrame(animFrame.current); animFrame.current = null; }
};

const initAudioMotion = (ws) => {
if (!spectrumRef.current) return;
const mediaEl = ws.backend?.media || ws.getMediaElement?.();
if (!mediaEl) return;
try {
    if (audioMotion.current) { try { audioMotion.current.destroy(); } catch {} audioMotion.current = null; }
    const w = spectrumRef.current.getBoundingClientRect().width || 800;
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
    barSpace:      0.25,
    smoothing:     0.75,
    minFreq:       30,
    maxFreq:       20000,
    channelLayout: 'single',
    width:         w,
    height:        150,
    });
} catch (err) { console.warn('audioMotion init failed:', err); }
};

useEffect(() => {
if (!waveformRef.current || !audioUrl) return;

setIsPlaying(false);
setIsLoading(true);
setCurrentTime(0);
setDuration(0);
stopTimeLoop();

const cs = getComputedStyle(document.documentElement);
const accentColor   = cs.getPropertyValue('--accent-primary').trim() || '#14B8A6';
const textSecondary = cs.getPropertyValue('--text-secondary').trim() || '#cbd5e1';

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
    interact:      true,   // let WaveSurfer handle click-to-seek on the wave
    volume:        0.75,
});

wavesurfer.current = ws;
ws.setVolume(0.75);

// KEY FIX: load AFTER two animation frames so the browser has fully laid out
// the grid. Without this, WaveSurfer measures the container before CSS grid
// has distributed widths, gets a wrong (smaller) number, and renders short.
requestAnimationFrame(() => {
    requestAnimationFrame(() => {
    if (ws && !ws.isDestroyed) ws.load(audioUrl);
    });
});

// Keep both canvases full-width as the window resizes
const syncWidths = () => {
    if (ws && !ws.isDestroyed) { try { ws.drawBuffer(); } catch {} }
    if (audioMotion.current && spectrumRef.current) {
    try { audioMotion.current.width = spectrumRef.current.getBoundingClientRect().width; } catch {}
    }
};
const ro = new ResizeObserver(syncWidths);
if (waveformRef.current) ro.observe(waveformRef.current);

ws.on('ready', () => {
    setIsLoading(false);
    setDuration(ws.getDuration());
    ws.setVolume(prevVolume.current / 100);
    if (onReadyRef.current) onReadyRef.current();
    initAudioMotion(ws);
    requestAnimationFrame(syncWidths);
});

ws.on('play',   () => { setIsPlaying(true);  startTimeLoop(ws); if (onPlayRef.current)  onPlayRef.current();  });
ws.on('pause',  () => { setIsPlaying(false); stopTimeLoop();    if (onPauseRef.current) onPauseRef.current(); });
ws.on('finish', () => { setIsPlaying(false); stopTimeLoop(); setCurrentTime(0); if (onPauseRef.current) onPauseRef.current(); });
ws.on('seek',   () => { setCurrentTime(ws.getCurrentTime()); });
ws.on('error',  err => { console.error('WaveSurfer error:', err); setIsLoading(false); });

return () => {
    stopTimeLoop();
    ro.disconnect();
    if (audioMotion.current) { try { audioMotion.current.destroy(); } catch {} audioMotion.current = null; }
    ws.destroy();
};
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [audioUrl, height]);

useEffect(() => {
const handleResize = () => {
    if (audioMotion.current && spectrumRef.current) {
    try { audioMotion.current.width = spectrumRef.current.getBoundingClientRect().width; } catch {}
    }
};
window.addEventListener('resize', handleResize);
return () => window.removeEventListener('resize', handleResize);
}, []);

const togglePlay = () => { if (wavesurfer.current && !isLoading) wavesurfer.current.playPause(); };

const handleVolumeChange = e => {
const val = parseInt(e.target.value);
setVolume(val); prevVolume.current = val; setIsMuted(val === 0);
if (wavesurfer.current) wavesurfer.current.setVolume(val / 100);
};

const toggleMute = () => {
if (!wavesurfer.current) return;
if (isMuted) {
    const r = prevVolume.current || 75;
    setVolume(r); setIsMuted(false); wavesurfer.current.setVolume(r / 100);
} else {
    prevVolume.current = volume; setVolume(0); setIsMuted(true); wavesurfer.current.setVolume(0);
}
};

const handleProgressClick = e => {
if (!wavesurfer.current || !duration) return;
const rect = e.currentTarget.getBoundingClientRect();
const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
wavesurfer.current.seekTo(pct);
setCurrentTime(pct * duration);
};

const formatTime = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const progressPct = duration ? (currentTime / duration) * 100 : 0;

return (
<div className="waveform-player glass">

    {/* Rainbow spectrum — zero padding parent so it truly fills card width */}
    <div ref={spectrumRef} className="audiomotion-container" />

    {/* WaveSurfer waveform — zero padding so JS measures correct width */}
    <div className="waveform-section">
    <div ref={waveformRef} className={`waveform-canvas ${isLoading ? 'loading' : ''}`} />
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
    <button className="play-btn" onClick={togglePlay} disabled={isLoading} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        )}
    </button>

    <div className="timeline">
        <span className="current-time">{formatTime(currentTime)}</span>
        <div className="progress-bar-container" onClick={handleProgressClick}
        role="slider" aria-label="Seek"
        aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{ width: `${progressPct}%` }}/>
        </div>
        <span className="total-time">{formatTime(duration)}</span>
    </div>

    <div className="volume-control">
        <button className="volume-icon" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
        {isMuted || volume === 0 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
        ) : volume < 50 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 9v6h4l5 5V4l-5 5H7z"/></svg>
        ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
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