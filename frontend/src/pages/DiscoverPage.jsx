import { useCallback, useEffect, useState } from 'react';
import TrackCard from '../components/tracks/TrackCard';
import api from '../services/api';

function DiscoverPage() {
const [tracks, setTracks] = useState([]);
const [filters, setFilters] = useState({ bpm_min: '', bpm_max: '', energy_level: '', genre: '' });
const [loading, setLoading] = useState(true);
const [isFilterOpen, setIsFilterOpen] = useState(false);

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

const clearFilters = () => {
setFilters({ bpm_min: '', bpm_max: '', energy_level: '', genre: '' });
};

const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

return (
<div className="min-h-screen bg-[var(--bg-primary)] px-4 transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header */}
    <div className="mb-8">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Discover Tracks</h1>
        <p className="text-[var(--text-secondary)]">Find the perfect collaboration match</p>
    </div>

    {/* Filter Bar */}
    <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
        <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg hover:border-primary-500 transition-colors"
        >
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-[var(--text-primary)] font-medium">Filters</span>
            {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-semibold rounded-full">
                {activeFilterCount}
            </span>
            )}
        </button>

        {activeFilterCount > 0 && (
            <button
            onClick={clearFilters}
            className="text-sm text-[var(--text-tertiary)] hover:text-primary-500 transition-colors"
            >
            Clear all
            </button>
        )}
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
        <div className="glass-panel p-6 rounded-2xl animate-slide-down">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* BPM Range */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                BPM Range
                </label>
                <div className="flex gap-2">
                <input
                    type="number"
                    placeholder="Min"
                    value={filters.bpm_min}
                    onChange={(e) => setFilters({ ...filters, bpm_min: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <input
                    type="number"
                    placeholder="Max"
                    value={filters.bpm_max}
                    onChange={(e) => setFilters({ ...filters, bpm_max: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                </div>
            </div>

            {/* Energy Level */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                Energy Level
                </label>
                <select
                value={filters.energy_level}
                onChange={(e) => setFilters({ ...filters, energy_level: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                <option value="">All Energy Levels</option>
                <option value="low">Low Energy</option>
                <option value="medium">Medium Energy</option>
                <option value="high">High Energy</option>
                </select>
            </div>

            {/* Genre */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                Genre
                </label>
                <input
                type="text"
                placeholder="e.g., Electronic, Hip-Hop"
                value={filters.genre}
                onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
            </div>

            {/* Apply Button - refreshes for new instances when as the filters will already show the current tracks and loops */}
            <div className="space-y-2">
                <button
                onClick={fetchTracks}
                className="w-full px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-lg transition-all shadow-lg shadow-primary-500/20"
                >
                Apply Filters
                </button>
            </div>
            </div>
        </div>
        )}
    </div>

    {/* Active Filters Display */}
    {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
        {filters.bpm_min && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-sm text-primary-400">
            Min BPM: {filters.bpm_min}
            <button
                onClick={() => setFilters({ ...filters, bpm_min: '' })}
                className="hover:text-primary-300"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            </span>
        )}
        {filters.bpm_max && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-sm text-primary-400">
            Max BPM: {filters.bpm_max}
            <button
                onClick={() => setFilters({ ...filters, bpm_max: '' })}
                className="hover:text-primary-300"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            </span>
        )}
        {filters.energy_level && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-sm text-primary-400 capitalize">
            {filters.energy_level} Energy
            <button
                onClick={() => setFilters({ ...filters, energy_level: '' })}
                className="hover:text-primary-300"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            </span>
        )}
        {filters.genre && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-sm text-primary-400">
            Genre: {filters.genre}
            <button
                onClick={() => setFilters({ ...filters, genre: '' })}
                className="hover:text-primary-300"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            </span>
        )}
        </div>
    )}

    {/* Results Count */}
    {!loading && (
        <div className="mb-6">
        <p className="text-[var(--text-secondary)] text-sm">
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} found
        </p>
        </div>
    )}

    {/* Tracks Grid */}
    {loading ? (
        <div className="text-center py-20">
        <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--text-secondary)] mt-4">Loading tracks...</p>
        </div>
    ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
        ))}
        {tracks.length === 0 && (
            <div className="col-span-full text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--bg-tertiary)] rounded-full mb-4">
                <svg className="w-10 h-10 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
            </div>
            <p className="text-[var(--text-primary)] text-lg font-semibold mb-2">No tracks found</p>
            <p className="text-[var(--text-tertiary)] text-sm">Try adjusting your filters or check back later</p>
            </div>
        )}
        </div>
    )}
    </div>
</div>
);
}

export default DiscoverPage;