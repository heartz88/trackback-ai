import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

const WaveformPlayer = ({ audioUrl, height = 128, onReady, onPlay, onPause, onAnalyserReady }) => {
const waveformRef = useRef(null);
const audioMotionRef = useRef(null);
const audioMotionContainerRef = useRef(null);
const wavesurfer = useRef(null);
const audioCtx = useRef(null);
const analyserNode = useRef(null);
const analyserConnected = useRef(false);

const [isPlaying, setIsPlaying] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [volume, setVolume] = useState(75);
const [beatFlash, setBeatFlash] = useState(false);

const lastBeatRef = useRef(0);

const initAudioMotion = useCallback(() => {
if (analyserConnected.current) return;
try {
    const ws = wavesurfer.current;
    if (!ws) return;
    const mediaEl = ws.getMediaElement();
    if (!mediaEl) return;
    if (!audioMotionContainerRef.current) return;

    // Create AudioContext
    if (!audioCtx.current) {
    audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ac = audioCtx.current;
    if (ac.state === 'suspended') ac.resume();

    // Create analyser node for beat detection + pass to parent
    const analyser = ac.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyserNode.current = analyser;

    // Connect media element -> analyser -> destination
    const source = ac.createMediaElementSource(mediaEl);
    source.connect(analyser);
    analyser.connect(ac.destination);

    analyserConnected.current = true;
    if (onAnalyserReady) onAnalyserReady(analyser);

    // Initialise audioMotion-analyzer, connecting to our existing AudioContext
    // audioMotion will create its OWN internal analyser & connect to the source
    // We pass the audioCtx and source node so it reuses the same audio graph
    audioMotionRef.current = new AudioMotionAnalyzer(audioMotionContainerRef.current, {
    audioCtx: ac,
    source: source,
    mode: 10,                  // Octave bands (1/24th octave) — looks incredible
    gradient: 'rainbow',
    showBgColor: false,
    bgAlpha: 0,
    overlay: true,             // transparent background
    showScaleX: false,
    showScaleY: false,
    showPeaks: true,
    peakLine: false,
    smoothing: 0.82,
    minFreq: 30,
    maxFreq: 18000,
    barSpace: 0.3,
    reflexRatio: 0.45,         // mirror reflection at bottom
    reflexAlpha: 0.2,
    reflexFit: true,
    lineWidth: 0,
    fillAlpha: 1,
    radial: false,
    spin: 0,
    splitGradient: false,
    roundBars: true,
    lumiBars: false,
    alphaBars: false,
    ansiBands: false,
    weightingFilter: 'D',      // perceptual weighting — emphasises how humans hear
    });

    // Beat detection via our analyser node
    const detectBeats = () => {
    if (!analyserNode.current) return;
    const data = new Uint8Array(analyserNode.current.frequencyBinCount);
    analyserNode.current.getByteFrequencyData(data);
    const bassEnd = Math.floor(data.length * 0.06);
    let bassSum = 0;
    for (let i = 0; i < bassEnd; i++) bassSum += data[i];
    const bassAvg = bassSum / bassEnd;
    const now = performance.now();
    if (bassAvg > 160 && now - lastBeatRef.current > 250) {
        lastBeatRef.current = now;
        setBeatFlash(true);
        setTimeout(() => setBeatFlash(false), 130);
    }
    if (isPlayingRef.current) requestAnimationFrame(detectBeats);
    };
    requestAnimationFrame(detectBeats);

    console.log('audioMotion-analyzer: connected ✅');
} catch (e) {
    console.warn('audioMotion init failed:', e.message);
}
}, [onAnalyserReady]);

const isPlayingRef = useRef(false);

useEffect(() => {
if (!waveformRef.current) return;

const cs = getComputedStyle(document.documentElement);
const accent = cs.getPropertyValue('--accent-primary').trim() || '#14B8A6';
const textSec = cs.getPropertyValue('--text-secondary').trim() || '#cbd5e1';

wavesurfer.current = WaveSurfer.create({
    container: waveformRef.current,
    waveColor: textSec,
    progressColor: accent,
    cursorColor: accent,
    barWidth: 2,
    barRadius: 3,
    cursorWidth: 2,
    height,
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
    initAudioMotion();
    if (audioCtx.current?.state === 'suspended') audioCtx.current.resume();
    if (onPlay) onPlay();
});

wavesurfer.current.on('pause', () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (onPause) onPause();
});

wavesurfer.current.on('finish', () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
});

wavesurfer.current.on('audioprocess', () => setCurrentTime(wavesurfer.current.getCurrentTime()));
wavesurfer.current.on('seek', () => setCurrentTime(wavesurfer.current.getCurrentTime()));

return () => {
    isPlayingRef.current = false;
    if (audioMotionRef.current) {
    try { audioMotionRef.current.destroy(); } catch (_) {}
    audioMotionRef.current = null;
    }
    if (wavesurfer.current) wavesurfer.current.destroy();
    if (audioCtx.current) { audioCtx.current.close(); audioCtx.current = null; }
    analyserConnected.current = false;
};
}, [audioUrl, height, onReady, onPlay, onPause, initAudioMotion]);

const togglePlay = () => { if (wavesurfer.current) wavesurfer.current.playPause(); };

const handleVolumeChange = (e) => {
const v = parseInt(e.target.value);
setVolume(v);
if (wavesurfer.current) wavesurfer.current.setVolume(v / 100);
if (audioMotionRef.current) audioMotionRef.current.volume = v / 100;
};

const fmt = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

return (
<div className="waveform-player glass" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

    {/* audioMotion spectrum — shown when playing, hidden when paused */}
    <div
    ref={audioMotionContainerRef}
    style={{
        width: '100%',
        height: isLoading ? 0 : 120,
        borderRadius: '12px 12px 0 0',
        overflow: 'hidden',
        opacity: isPlaying ? 1 : 0,
        transition: 'opacity 0.5s ease, height 0.3s ease',
        background: 'transparent',
    }}
    />

    {/* Static WaveSurfer waveform (always visible) */}
    <div
    ref={waveformRef}
    className={`waveform-canvas ${isLoading ? 'loading' : ''}`}
    style={{ marginTop: isPlaying ? 4 : 0, transition: 'margin 0.3s ease' }}
    />

    {/* Loading */}
    {isLoading && (
    <div className="waveform-loading">
        <div className="music-loader">
        {[...Array(5)].map((_, i) => <div key={i} className="music-loader-bar" />)}
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
        transition: 'transform 0.08s ease, box-shadow 0.08s ease',
        transform: beatFlash && isPlaying ? 'scale(1.15)' : 'scale(1)',
        boxShadow: beatFlash && isPlaying ? '0 0 22px 6px var(--accent-primary, #14B8A6)' : undefined,
        }}
    >
        {isPlaying ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
        ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        )}
    </button>

    <div className="timeline">
        <span className="current-time">{fmt(currentTime)}</span>
        <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${(currentTime / duration) * 100 || 0}%` }} />
        </div>
        <span className="total-time">{fmt(duration)}</span>
    </div>

    <div className="volume-control">
        <button className="volume-icon">
        {volume === 0 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
        ) : volume < 50 ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 9v6h4l5 5V4l-5 5H7z" /></svg>
        ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
        )}
        </button>
        <input type="range" className="volume-slider" min="0" max="100" value={volume} onChange={handleVolumeChange} />
    </div>
    </div>
</div>
);
};

export default WaveformPlayer;