import { useCallback, useEffect, useState } from 'react';
import TrackCard from '../components/tracks/TrackCard';
import api from '../services/api';

function DiscoverPage() {
const [tracks, setTracks] = useState([]);
const [filters, setFilters] = useState({ bpm_min: '', bpm_max: '', energy_level: '', genre: '' });
const [loading, setLoading] = useState(true);

const fetchTracks = useCallback(async () => {
setLoading(true);
try {
    const params = {};
    if (filters.bpm_min) params.bpm_min = filters.bpm_min;
    if (filters.bpm_max) params.bpm_max = filters.bpm_max;
    if (filters.energy_level) params.energy_level = filters.energy_level;
    if (filters.genre) params.genre = filters.genre;

    const response = await api.get('/tracks', { params });
    setTracks(response.data.tracks);
} catch (err) {
    console.error('Failed to fetch tracks:', err);
} finally {
    setLoading(false);
}
}, [filters]);

useEffect(() => {
fetchTracks();
}, [fetchTracks]);

return (
<div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 transition-colors duration-300">
    <div className="max-w-7xl mx-auto">
    <div className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">Discover Tracks</h1>
        <p className="text-[var(--text-secondary)]">Find the perfect collaboration match</p>
    </div>

    <div className="glass-panel p-6 rounded-2xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
            type="number"
            placeholder="Min BPM"
            value={filters.bpm_min}
            onChange={(e) => setFilters({ ...filters, bpm_min: e.target.value })}
            className="px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <input
            type="number"
            placeholder="Max BPM"
            value={filters.bpm_max}
            onChange={(e) => setFilters({ ...filters, bpm_max: e.target.value })}
            className="px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
            value={filters.energy_level}
            onChange={(e) => setFilters({ ...filters, energy_level: e.target.value })}
            className="px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
            <option value="">All Energy</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
        </select>
        <input
            type="text"
            placeholder="Genre"
            value={filters.genre}
            onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
            className="px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
            onClick={fetchTracks}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20"
        >
            Apply
        </button>
        </div>
    </div>

    {loading ? (
        <div className="text-center py-20">
        <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
        ))}
        {tracks.length === 0 && (
            <div className="col-span-full text-center py-20">
            <svg className="mx-auto h-16 w-16 text-[var(--text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-[var(--text-secondary)] text-lg">No tracks found</p>
            <p className="text-[var(--text-tertiary)] text-sm mt-2">Try adjusting your filters</p>
            </div>
        )}
        </div>
    )}
    </div>
</div>
);
}

export default DiscoverPage;