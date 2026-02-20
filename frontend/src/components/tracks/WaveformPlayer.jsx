import { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

const WaveformPlayer = ({ audioUrl, height = 128, onReady, onPlay, onPause }) => {
  const waveformRef = useRef(null);
  const waveformWrapRef = useRef(null);
  const analyzerCanvasRef = useRef(null);
  const wavesurfer = useRef(null);
  const analyserNode = useRef(null);
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

  // Try to connect the analyser — called on ready AND on first play
  // because WaveSurfer only creates the source node when playback starts
  const tryConnectAnalyser = useCallback(() => {
    if (analyserConnected.current) return;
    try {
      const ws = wavesurfer.current;
      if (!ws) return;

      const backend = ws.backend;
      const ac = backend.ac;

      // WaveSurfer v6: source node lives on backend.source after play starts
      let sourceNode = backend.source || backend.sourceNode;

      if (!sourceNode) {
        // Fallback for WaveSurfer v7+ or MediaElement backend
        const mediaEl = ws.getMediaElement?.() || backend.media;
        if (mediaEl) {
          sourceNode = ac.createMediaElementSource(mediaEl);
        }
      }

      if (!sourceNode) {
        console.warn('WaveformPlayer: no source node found yet');
        return;
      }

      const analyser = ac.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;

      sourceNode.connect(analyser);
      analyser.connect(ac.destination);

      analyserNode.current = analyser;
      analyserConnected.current = true;

      // Size canvas to match wrapper
      const canvas = analyzerCanvasRef.current;
      const wrap = waveformWrapRef.current;
      if (canvas && wrap) {
        canvas.width = wrap.clientWidth;
        canvas.height = wrap.clientHeight;
      }
    } catch (e) {
      console.warn('WaveformPlayer: analyser connect failed:', e);
    }
  }, []);

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

    // Beat detection — watch sub-bass bins (roughly 20–200Hz)
    const bassEnd = Math.floor(bufferLength * 0.06);
    let bassEnergy = 0;
    for (let i = 0; i < bassEnd; i++) bassEnergy += dataArray[i];
    bassEnergy /= bassEnd;

    energyHistory.current.push(bassEnergy);
    energyHistory.current.shift();
    const avgEnergy = energyHistory.current.reduce((a, b) => a + b, 0) / energyHistory.current.length;

    const now = performance.now();
    const isBeat = bassEnergy > avgEnergy * 1.4 && bassEnergy > 60 && now - lastBeatTime.current > 220;
    if (isBeat) {
      lastBeatTime.current = now;
      setBeatScale(1.1);
      setTimeout(() => setBeatScale(1), 110);
    }

    // Draw bars overlaid on waveform
    const computedStyle = getComputedStyle(document.documentElement);
    const accentColor = computedStyle.getPropertyValue('--accent-primary').trim() || '#14B8A6';

    const barCount = 80;
    const step = Math.floor(bufferLength / barCount);
    const barW = W / barCount - 1;

    for (let i = 0; i < barCount; i++) {
      let val = 0;
      for (let j = 0; j < step; j++) val += dataArray[i * step + j];
      val /= step;

      if (val < 4) continue;

      const barH = (val / 255) * (H * 0.9);
      const x = i * (barW + 1);
      const y = H / 2 - barH / 2;
      const alpha = 0.25 + (val / 255) * 0.55;
      const isBassBar = i < Math.floor(barCount * 0.1);

      ctx.globalAlpha = isBassBar ? Math.min(alpha * 1.4, 0.95) : alpha;
      ctx.shadowBlur = isBassBar && bassEnergy > avgEnergy * 1.2 ? 10 : 0;
      ctx.shadowColor = accentColor;
      ctx.fillStyle = accentColor;

      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 2);
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
    const canvas = analyzerCanvasRef.current;
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
      responsive: true,
      backend: 'WebAudio',
    });

    wavesurfer.current.load(audioUrl);

    wavesurfer.current.on('ready', () => {
      setIsLoading(false);
      setDuration(wavesurfer.current.getDuration());
      tryConnectAnalyser(); // may succeed here in some WS versions
      if (onReady) onReady();
    });

    wavesurfer.current.on('play', () => {
      isPlayingRef.current = true;
      setIsPlaying(true);
      tryConnectAnalyser(); // source node definitely exists now
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

    const ro = new ResizeObserver(() => {
      const canvas = analyzerCanvasRef.current;
      const wrap = waveformWrapRef.current;
      if (canvas && wrap) {
        canvas.width = wrap.clientWidth;
        canvas.height = wrap.clientHeight;
      }
    });
    if (waveformWrapRef.current) ro.observe(waveformWrapRef.current);

    return () => {
      isPlayingRef.current = false;
      stopAnalyzer();
      ro.disconnect();
      if (wavesurfer.current) wavesurfer.current.destroy();
    };
  }, [audioUrl, height, onReady, onPlay, onPause, tryConnectAnalyser, startAnalyzer, stopAnalyzer]);

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
      {/* Waveform + overlaid analyzer canvas */}
      <div ref={waveformWrapRef} style={{ position: 'relative', width: '100%' }}>
        <div
          ref={waveformRef}
          className={`waveform-canvas ${isLoading ? 'loading' : ''}`}
        />
        <canvas
          ref={analyzerCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: isPlaying ? 1 : 0,
            transition: 'opacity 0.5s ease',
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
              : 'transform 0.15s ease-in, box-shadow 0.15s ease-in',
            boxShadow: beatScale > 1
              ? '0 0 16px 4px var(--accent-primary, #14B8A6)'
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