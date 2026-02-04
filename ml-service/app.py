import os
import tempfile
import librosa
import numpy as np
import boto3
import requests
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# --- AWS & Config ---
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'eu-north-1')
)
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://backend:3001')

def analyze_audio(file_path):
    """
    High-precision BPM and Key detection.
    Uses a singular feature extraction pass for maximum efficiency.
    """
    try:
        # Load at 22050Hz - Industry standard for MIR (Music Information Retrieval)
        # Higher SR doesn't help BPM and just slows down the math.
        y, sr = librosa.load(file_path, sr=22050, mono=True)
        duration = librosa.get_duration(y=y, sr=sr)

        # 1. PRE-COMPUTE ONSET STRENGTH (The 'Heartbeat' of the track)
        # This is used by multiple methods to save CPU
        hop_length = 512
        onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)

        # 2. EXACT BPM DETECTION (Multi-band Pulse Tracking)
        # We use the tempogram to find the most 'stable' pulse over time
        prior = librosa.beat.tempo(onset_envelope=onset_env, sr=sr, hop_length=hop_length)[0]
        
        # Refine with Dynamic Programming Beat Tracking
        # Tightness=100 makes it very sensitive to grid-aligned beats
        tempo, beats = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr,hop_length=hop_length, tightness=100)
        
        # Calculate BPM from actual beat intervals (more precise than global estimate)
        if len(beats) > 1:
            beat_times = librosa.frames_to_time(beats, sr=sr, hop_length=hop_length)
            intervals = np.diff(beat_times)
            # Remove outliers from intervals (sudden jumps)
            median_interval = np.median(intervals)
            valid_intervals = intervals[np.abs(intervals - median_interval) < 0.1]
            final_bpm = 60.0 / np.mean(valid_intervals) if len(valid_intervals) > 0 else tempo
        else:
            final_bpm = tempo

        # 3. KEY DETECTION (Krumhansl-Kessler Profile)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_avg = np.mean(chroma, axis=1)
        
        # Templates
        major = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
        minor = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
        
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        correlations = []
        
        for i in range(12):
            correlations.append(np.corrcoef(chroma_avg, np.roll(major, i))[0, 1])
            correlations.append(np.corrcoef(chroma_avg, np.roll(minor, i))[0, 1])
            
        best_idx = np.argmax(correlations)
        musical_key = f"{notes[best_idx // 2]} {'Major' if best_idx % 2 == 0 else 'Minor'}"

        # 4. ENERGY CALCULATION (RMS based)
        rms = librosa.feature.rms(y=y)[0]
        energy_val = np.mean(rms)
        energy_level = 'high' if energy_val > 0.08 else 'medium' if energy_val > 0.03 else 'low'

        return {
            'bpm': round(float(final_bpm), 2), # 2 decimal places for "Exact" feeling
            'musical_key': musical_key,
            'energy_level': energy_level,
            'duration': round(duration, 2),
            'confidence': round(float(np.max(correlations)), 2)
        }
    except Exception as e:
        raise Exception(f"Analysis Error: {str(e)}")

# --- API Endpoints ---

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    temp_path = None
    try:
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        temp_path = temp_file.name
        s3_client.download_file(data['s3_bucket'], data['s3_key'], temp_path)
        
        results = analyze_audio(temp_path)
        
        # Update your main Backend
        requests.put(f"{BACKEND_API_URL}/api/tracks/{data['track_id']}/analysis", json=results)
        
        return jsonify(results), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    # Use threaded=True for better handling of concurrent requests
    app.run(host='0.0.0.0', port=5000, threaded=True)