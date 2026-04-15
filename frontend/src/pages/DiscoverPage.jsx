import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TrackCard from '../components/tracks/TrackCard';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

function DiscoverPage() {
const { user } = useAuth();
const { on } = useSocket();
const [tracks, setTracks] = useState([]);
const [newTrackBanner, setNewTrackBanner] = useState(false);
const [filters, setFilters] = useState({ search: '', bpm_min: '', bpm_max: '', energy_level: '', genre: '' });
const [loading, setLoading] = useState(true);
const [isFilterOpen, setIsFilterOpen] = useState(false);

const fetchTracks = useCallback(async () => {
setLoading(true);
try {
    const params = {};
    if (filters.search)       params.search       = filters.search;
    if (filters.bpm_min)      params.bpm_min      = filters.bpm_min;
    if (filters.bpm_max)      params.bpm_max      = filters.bpm_max;
    if (filters.energy_level) params.energy_level = filters.energy_level;
    if (filters.genre)        params.genre        = filters.genre;

    const response = await api.get('/tracks', { params });
    setTracks(response.data.tracks);
    setGridKey(k => k + 1);
} catch (err) {
    console.error('Failed to fetch tracks:', err);
} finally {
    setLoading(false);
}
}, [filters]);

useEffect(() => { fetchTracks(); }, [fetchTracks]);

useEffect(() => {
const unsub = on('track:new', () => { setNewTrackBanner(true); });
return unsub;
}, [on]);

const clearFilters = () => setFilters({ search: '', bpm_min: '', bpm_max: '', energy_level: '', genre: '' });
// search doesn't count as an "advanced" filter for the badge — only the panel filters do
const activeFilterCount = [filters.bpm_min, filters.bpm_max, filters.energy_level, filters.genre].filter(v => v !== '').length;

return (
<div className="min-h-screen bg-[var(--bg-primary)] px-4 animate-fade-in">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    {/* Header */}
    <div className="flex items-center justify-between mb-8 flex-wrap gap-4 animate-slide-up stagger-1">
        <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">Discover Tracks</h1>
        <p className="text-[var(--text-secondary)]">Find the perfect collaboration match</p>
        </div>
        {user && (
        <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Track
        </Link>
        )}
    </div>

    {/* Search bar — always visible */}
    <div className="mb-4 animate-slide-up stagger-2">
        <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
            type="text"
            placeholder="Search tracks by title..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-[box-shadow,border-color]"
        />
        {filters.search && (
            <button
            onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
        )}
        </div>
    </div>

    {/* New track banner */}
    {newTrackBanner && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 bg-primary-500/10 border border-primary-500/30 rounded-xl text-primary-400 text-sm font-medium animate-slide-down">
        <span>🎵 New tracks available!</span>
        <button
            onClick={() => { fetchTracks(); setNewTrackBanner(false); }}
            className="px-3 py-1 bg-primary-600 hover:bg-primary-500 text-white text-xs rounded-lg transition-[box-shadow,border-color]"
        >
            Refresh
        </button>
        </div>
    )}

    {/* Advanced Filter Bar */}
    <div className="mb-8 animate-slide-up stagger-3">
        <div className="flex items-center justify-between mb-4">
        <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg hover:border-primary-500"
        >
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-[var(--text-primary)] font-medium">Advanced Filters</span>
            {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-semibold rounded-full">{activeFilterCount}</span>
            )}
        </button>
        {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-[var(--text-tertiary)] hover:text-primary-500">
            Clear all
            </button>
        )}
        </div>

        {isFilterOpen && (
        <div className="glass-panel p-6 rounded-2xl animate-slide-down">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">BPM Range</label>
                <div className="flex gap-2">
                <input type="number" placeholder="Min" value={filters.bpm_min}
                    onChange={e => setFilters({ ...filters, bpm_min: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input type="number" placeholder="Max" value={filters.bpm_max}
                    onChange={e => setFilters({ ...filters, bpm_max: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Energy Level</label>
                <select value={filters.energy_level} onChange={e => setFilters({ ...filters, energy_level: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                <option value="">All Energy Levels</option>
                <option value="low">Low Energy</option>
                <option value="medium">Medium Energy</option>
                <option value="high">High Energy</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">Genre</label>
                <input type="text" placeholder="e.g., Electronic, Hip-Hop" value={filters.genre}
                onChange={e => setFilters({ ...filters, genre: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            <div className="space-y-2 flex items-end">
                <button onClick={fetchTracks}
                className="w-full px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-lg transition-[box-shadow,border-color] shadow-lg shadow-primary-500/20"
                >
                Apply Filters
                </button>
            </div>
            </div>
        </div>
        )}
    </div>

    {/* Active Filter Tags */}
    {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
        {filters.bpm_min    && <FilterTag label={`Min BPM: ${filters.bpm_min}`}    onRemove={() => setFilters({ ...filters, bpm_min: '' })} />}
        {filters.bpm_max    && <FilterTag label={`Max BPM: ${filters.bpm_max}`}    onRemove={() => setFilters({ ...filters, bpm_max: '' })} />}
        {filters.energy_level && <FilterTag label={`${filters.energy_level} Energy`} onRemove={() => setFilters({ ...filters, energy_level: '' })} />}
        {filters.genre      && <FilterTag label={`Genre: ${filters.genre}`}        onRemove={() => setFilters({ ...filters, genre: '' })} />}
        </div>
    )}

    {!loading && (
        <p className="text-[var(--text-secondary)] text-sm mb-6">
        {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} found
        {filters.search && <span className="text-[var(--text-tertiary)]"> for "{filters.search}"</span>}
        </p>
    )}

    {loading ? (
        <div className="text-center py-20">
        <div className="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--text-secondary)] mt-4">Loading tracks...</p>
        </div>
    ) : tracks.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-tertiary)] rounded-3xl border border-[var(--border-color)]">
        <svg className="mx-auto w-16 h-16 text-[var(--text-tertiary)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <p className="text-[var(--text-primary)] text-lg font-semibold mb-2">No tracks found</p>
        <p className="text-[var(--text-tertiary)] text-sm mb-4">
            {filters.search ? `No tracks match "${filters.search}"` : 'Try adjusting your filters or check back later'}
        </p>
        {(activeFilterCount > 0 || filters.search) && (
            <button onClick={clearFilters} className="text-primary-400 hover:text-primary-300 text-sm font-medium">
            Clear all filters
            </button>
        )}
        </div>
    ) : (
        <div key={gridKey} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((track, i) => (
          <div key={track.id} className={`animate-slide-up stagger-${Math.min(i + 1, 8)}`}>
            <TrackCard track={track} />
          </div>
        ))}
        </div>
    )}

    {!user && tracks.length > 0 && (
        <div className="mt-12 text-center py-10 bg-gradient-to-br from-primary-500/10 to-primary-600/5 rounded-3xl border border-primary-500/20">
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Want to collaborate?</h3>
        <p className="text-[var(--text-secondary)] mb-4">Sign up to request collaborations and submit your versions</p>
        <div className="flex gap-3 justify-center">
            <Link to="/register" className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-[box-shadow,border-color]">Get Started Free</Link>
            <Link to="/login" className="px-6 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold rounded-xl transition-[box-shadow,border-color] border border-[var(--border-color)]">Sign In</Link>
        </div>
        </div>
    )}
    </div>
</div>
);
}

function FilterTag({ label, onRemove }) {
return (
<span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-sm text-primary-400">
    {label}
    <button onClick={onRemove} className="hover:text-primary-300">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
    </button>
</span>
);
}

export default DiscoverPage;