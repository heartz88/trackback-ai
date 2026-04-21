import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReceivedRequestCard from '../components/collaborations/ReceivedRequestCard';
import SentRequestCard from '../components/collaborations/SentRequestCard';
import { useCollaborations } from '../hooks/useCollaborations';

const toSlug = (title) => title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';
const TABS_ORDER = ['pending', 'history'];

export default function CollaborationsPage() {
const { received, sent, history, loading, handleResponse, handleCancel } = useCollaborations();
const [activeTab, setActiveTab] = useState('pending');
const [animating, setAnimating] = useState(false);
const prevTab = useRef('pending');

const handleTabChange = (tab) => {
if (tab === activeTab) return;
setAnimating(true);
setTimeout(() => { prevTab.current = activeTab; setActiveTab(tab); setAnimating(false); }, 180);
};
const slideDir = TABS_ORDER.indexOf(activeTab) > TABS_ORDER.indexOf(prevTab.current) ? 1 : -1;

if (loading) return (
<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="music-loader">{[...Array(5)].map((_, i) => <span key={i} className="music-loader-bar" />)}</div>
</div>
);

return (
<div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 animate-fade-in">
    <div className="max-w-7xl mx-auto">
    <div className="mb-8 animate-slide-up stagger-1">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Collaborations</h1>
        <p className="text-[var(--text-secondary)]">Manage your collaboration requests</p>
    </div>

    {/* Tabs */}
    <div className="relative mb-6 animate-slide-up stagger-2">
        <div className="absolute bottom-0 h-0.5 rounded-full transition-[box-shadow,border-color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ left: activeTab === 'pending' ? 0 : '50%', width: '50%',
            background: 'linear-gradient(90deg, var(--accent-primary, #14b8a6), #06b6d4)',
            boxShadow: '0 0 12px rgba(20,184,166,0.6)' }} />
        <div className="flex border-b border-[var(--border-color)]/40">
        {[
            { id: 'pending', label: 'Pending', icon: '⏳', count: received.length + sent.length },
            { id: 'history', label: 'History', icon: '📋', count: history.received.length + history.sent.length },
        ].map(({ id, label, icon, count }) => (
            <button key={id} onClick={() => handleTabChange(id)}
            className="relative flex-1 px-4 py-3 text-sm font-semibold transition-[box-shadow,border-color] duration-300 flex items-center justify-center gap-2 group"
            style={{ color: activeTab === id ? 'var(--accent-primary, #14b8a6)' : 'var(--text-tertiary)' }}>
            <span className="absolute inset-0 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(20,184,166,0.06)' }} />
            {activeTab === id && <span className="absolute inset-0 rounded-t-xl" style={{ background: 'rgba(20,184,166,0.08)' }} />}
            <span className="relative flex items-center gap-2">
                <span style={{ transform: activeTab === id ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.3s' }}>{icon}</span>
                {label}
                {count > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${id === 'pending' ? 'bg-red-500 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>{count}</span>
                )}
            </span>
            </button>
        ))}
        </div>
    </div>

    <div style={{ transition: 'opacity 0.18s ease, transform 0.18s ease', opacity: animating ? 0 : 1, transform: animating ? `translateX(${slideDir * 24}px)` : 'translateX(0)' }}>
        {activeTab === 'pending' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Received */}
            <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                Received Requests
                {received.length > 0 && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">{received.length} pending</span>}
            </h2>
            <div className="space-y-4">
                {received.map((req, i) => (
                <ReceivedRequestCard key={req.id} req={req} index={i}
                    onApprove={() => handleResponse(req.id, 'approved')}
                    onDecline={() => handleResponse(req.id, 'rejected')} />
                ))}
                {received.length === 0 && (
                <div className="text-center py-12 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)]">
                    <p className="text-[var(--text-secondary)]">No pending received requests</p>
                </div>
                )}
            </div>
            </div>

            {/* Sent */}
            <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                Sent Requests
                {sent.length > 0 && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">{sent.length} pending</span>}
            </h2>
            <div className="space-y-4">
                {sent.map((req, i) => (
                <SentRequestCard key={req.id} req={req} index={i} onCancel={() => handleCancel(req.id)} />
                ))}
                {sent.length === 0 && (
                <div className="text-center py-12 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)]">
                    <p className="text-[var(--text-secondary)] mb-3">No pending sent requests</p>
                    <Link to="/discover" className="text-primary-400 hover:text-primary-300 text-sm font-medium">Discover tracks to collaborate on →</Link>
                </div>
                )}
            </div>
            </div>
        </div>
        ) : (
        <div className="space-y-8">
            {history.received.length > 0 && (
            <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Received History</h2>
                <div className="space-y-3">
                {history.received.map(req => (
                    <div key={req.id} className="glass-panel p-4 rounded-xl opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                        <Link to={`/profile/${req.collaborator_name}`}>
                            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {req.collaborator_name?.[0]?.toUpperCase() || '?'}
                            </div>
                        </Link>
                        <div>
                            <Link to={`/profile/${req.collaborator_name}`} className="font-semibold text-[var(--text-primary)] hover:text-primary-400 text-sm">{req.collaborator_name}</Link>
                            <p className="text-xs text-[var(--text-secondary)]">on <Link to={`/tracks/${toSlug(req.track_title)}`} className="text-primary-400 hover:text-primary-300">"{req.track_title}"</Link></p>
                        </div>
                        </div>
                        <div className="flex items-center gap-3">
                        {req.status === 'approved' && (
                            <Link to={`/tracks/${toSlug(req.track_title)}/submissions`}
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium transition-[box-shadow,border-color]">
                            View Submissions
                            </Link>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            req.status === 'approved'  ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                            req.status === 'cancelled' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/30' :
                            'bg-red-500/10 text-red-400 border border-red-500/30'}`}>{req.status}</span>
                        </div>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-2">{new Date(req.updated_at || req.created_at).toLocaleDateString()}</p>
                    </div>
                ))}
                </div>
            </div>
            )}

            {history.sent.length > 0 && (
            <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Sent History</h2>
                <div className="space-y-3">
                {history.sent.map(req => (
                    <div key={req.id} className="glass-panel p-4 rounded-xl opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                        <Link to={`/tracks/${toSlug(req.track_title)}`} className="font-semibold text-[var(--text-primary)] hover:text-primary-400 text-sm">"{req.track_title}"</Link>
                        <p className="text-xs text-[var(--text-secondary)]">by <Link to={`/profile/${req.owner_name}`} className="text-primary-400 hover:text-primary-300">{req.owner_name}</Link></p>
                        </div>
                        <div className="flex items-center gap-3">
                        {req.status === 'approved' && (
                            <Link to={`/tracks/${toSlug(req.track_title)}/submissions`}
                            className="px-3 py-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg text-xs font-medium transition-[box-shadow,border-color]">
                            Submit Version →
                            </Link>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            req.status === 'approved'  ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                            req.status === 'cancelled' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/30' :
                            'bg-red-500/10 text-red-400 border border-red-500/30'}`}>{req.status}</span>
                        </div>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-2">{new Date(req.updated_at || req.created_at).toLocaleDateString()}</p>
                    </div>
                ))}
                </div>
            </div>
            )}

            {history.received.length === 0 && history.sent.length === 0 && (
            <div className="text-center py-20 bg-[var(--bg-tertiary)] rounded-3xl border border-[var(--border-color)]">
                <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No History Yet</h3>
                <p className="text-[var(--text-secondary)] mb-4">Your past collaborations will appear here</p>
                <Link to="/discover" className="text-primary-400 hover:text-primary-300 font-medium text-sm">Explore tracks to collaborate →</Link>
            </div>
            )}
        </div>
        )}
    </div>
    </div>
</div>
);
}