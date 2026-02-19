import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function CollaborationsPage() {
const [received, setReceived] = useState([]);
const [sent, setSent] = useState([]);
const [history, setHistory] = useState({ received: [], sent: [] });
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState('pending');

useEffect(() => {
const fetchRequests = async () => {
    try {
    setLoading(true);
    const [receivedRes, sentRes] = await Promise.all([
        api.get('/collaborations/requests/received'),
        api.get('/collaborations/requests/sent'),
    ]);

    const allReceived = receivedRes.data.requests || [];
    const allSent = sentRes.data.requests || [];

    setReceived(allReceived.filter((r) => r.status === 'pending'));
    setSent(allSent.filter((r) => r.status === 'pending'));
    setHistory({
        received: allReceived.filter((r) => r.status !== 'pending'),
        sent: allSent.filter((r) => r.status !== 'pending'),
    });
    } catch (err) {
    console.error('Failed to fetch requests:', err);
    } finally {
    setLoading(false);
    }
};
fetchRequests();
}, []);

const handleResponse = async (requestId, status) => {
try {
    await api.put(`/collaborations/requests/${requestId}`, { status });
    const respondedRequest = received.find((r) => r.id === requestId);
    setReceived(received.filter((r) => r.id !== requestId));
    if (respondedRequest) {
    setHistory({ ...history, received: [...history.received, { ...respondedRequest, status }] });
    }
    alert(`Request ${status}!`);
} catch (err) {
    alert('Action failed');
}
};

if (loading) {
return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="music-loader">
        <span className="music-loader-bar"></span>
        <span className="music-loader-bar"></span>
        <span className="music-loader-bar"></span>
        <span className="music-loader-bar"></span>
        <span className="music-loader-bar"></span>
    </div>
    </div>
);
}

return (
<div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
    <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Collaborations</h1>
        <p className="text-[var(--text-secondary)]">Manage your collaboration requests</p>
    </div>

    {/* Tabs */}
    <div className="flex gap-2 mb-6 border-b border-[var(--border-color)] pb-4">
        <button
        onClick={() => setActiveTab('pending')}
        className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
            activeTab === 'pending' ? 'bg-primary-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        >
        Pending
        {received.length + sent.length > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{received.length + sent.length}</span>
        )}
        </button>
        <button
        onClick={() => setActiveTab('history')}
        className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
            activeTab === 'history' ? 'bg-primary-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        >
        History
        {history.received.length + history.sent.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs rounded-full">
            {history.received.length + history.sent.length}
            </span>
        )}
        </button>
    </div>

    {activeTab === 'pending' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Received Requests */}
        <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            Received Requests
            {received.length > 0 && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">{received.length} pending</span>
            )}
            </h2>
            <div className="space-y-4">
            {received.map((req) => (
                <div key={req.id} className="glass-panel p-5 rounded-2xl border-l-4 border-l-yellow-500">
                <div className="flex items-start space-x-4 mb-4">
                    <Link to={`/profile/${req.collaborator_id}`} className="flex-shrink-0">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg hover:scale-105 transition-transform">
                        {req.collaborator_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                    <Link to={`/profile/${req.collaborator_id}`} className="text-[var(--text-primary)] font-semibold hover:text-primary-400 transition-colors">
                        {req.collaborator_name}
                    </Link>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        wants to collaborate on{' '}
                        <Link to={`/tracks/${req.track_id}`} className="text-primary-400 hover:text-primary-300 font-medium">
                        "{req.track_title}"
                        </Link>
                    </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium flex-shrink-0">
                    Pending
                    </span>
                </div>

                {req.message && (
                    <p className="text-[var(--text-secondary)] text-sm mb-4 bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-color)] italic">
                    "{req.message}"
                    </p>
                )}

                {/* Track quick link */}
                <div className="flex items-center gap-2 mb-4 p-2 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                    <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <Link to={`/tracks/${req.track_id}`} className="text-sm text-primary-400 hover:text-primary-300 truncate flex-1">
                    View track: "{req.track_title}"
                    </Link>
                </div>

                <div className="flex gap-2">
                    <button
                    onClick={() => handleResponse(req.id, 'approved')}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-all text-sm"
                    >
                    ✓ Approve
                    </button>
                    <Link
                    to={`/messages/new?userId=${req.collaborator_id}`}
                    className="px-4 py-2.5 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-xl transition-all text-sm border border-[var(--border-color)] flex items-center gap-1"
                    >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Message
                    </Link>
                    <button
                    onClick={() => handleResponse(req.id, 'rejected')}
                    className="px-4 py-2.5 bg-[var(--bg-tertiary)] hover:bg-red-500/10 hover:text-red-400 text-[var(--text-secondary)] font-medium rounded-xl transition-all text-sm border border-[var(--border-color)]"
                    >
                    Decline
                    </button>
                </div>
                </div>
            ))}
            {received.length === 0 && (
                <div className="text-center py-12 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)]">
                <p className="text-[var(--text-secondary)]">No pending received requests</p>
                </div>
            )}
            </div>
        </div>

        {/* Sent Requests */}
        <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            Sent Requests
            {sent.length > 0 && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">{sent.length} pending</span>
            )}
            </h2>
            <div className="space-y-4">
            {sent.map((req) => (
                <div key={req.id} className="glass-panel p-5 rounded-2xl border-l-4 border-l-blue-500">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                    <Link to={`/tracks/${req.track_id}`} className="text-[var(--text-primary)] font-semibold hover:text-primary-400 transition-colors">
                        "{req.track_title}"
                    </Link>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        by{' '}
                        <Link to={`/profile/${req.owner_id}`} className="text-primary-400 hover:text-primary-300">
                        {req.owner_name}
                        </Link>
                    </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium flex-shrink-0">
                    Pending
                    </span>
                </div>
                {req.message && (
                    <p className="text-[var(--text-secondary)] text-sm p-2 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] italic">
                    "{req.message}"
                    </p>
                )}
                {/* Quick links */}
                <div className="flex gap-2 mt-3">
                    <Link
                    to={`/tracks/${req.track_id}`}
                    className="flex-1 text-center py-2 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-lg text-sm transition-all border border-[var(--border-color)]"
                    >
                    View Track
                    </Link>
                    <Link
                    to={`/messages/new?userId=${req.owner_id}`}
                    className="flex-1 text-center py-2 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-secondary)] hover:text-primary-400 rounded-lg text-sm transition-all border border-[var(--border-color)]"
                    >
                    Message Owner
                    </Link>
                </div>
                </div>
            ))}
            {sent.length === 0 && (
                <div className="text-center py-12 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)]">
                <p className="text-[var(--text-secondary)] mb-3">No pending sent requests</p>
                <Link to="/discover" className="text-primary-400 hover:text-primary-300 text-sm font-medium">
                    Discover tracks to collaborate on →
                </Link>
                </div>
            )}
            </div>
        </div>
        </div>
    ) : (
        /* History Tab */
        <div className="space-y-8">
        {history.received.length > 0 && (
            <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Received History</h2>
            <div className="space-y-3">
                {history.received.map((req) => (
                <div key={req.id} className="glass-panel p-4 rounded-xl opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Link to={`/profile/${req.collaborator_id}`}>
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm hover:scale-105 transition-transform">
                            {req.collaborator_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        </Link>
                        <div>
                        <Link to={`/profile/${req.collaborator_id}`} className="font-semibold text-[var(--text-primary)] hover:text-primary-400 transition-colors text-sm">
                            {req.collaborator_name}
                        </Link>
                        <p className="text-xs text-[var(--text-secondary)]">
                            on{' '}
                            <Link to={`/tracks/${req.track_id}`} className="text-primary-400 hover:text-primary-300">
                            "{req.track_title}"
                            </Link>
                        </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {req.status === 'approved' && (
                        <Link
                            to={`/tracks/${req.track_id}/submissions`}
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium transition-all"
                        >
                            View Submissions
                        </Link>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        req.status === 'approved'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                        {req.status}
                        </span>
                    </div>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    {new Date(req.updated_at || req.created_at).toLocaleDateString()}
                    </p>
                </div>
                ))}
            </div>
            </div>
        )}

        {history.sent.length > 0 && (
            <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Sent History</h2>
            <div className="space-y-3">
                {history.sent.map((req) => (
                <div key={req.id} className="glass-panel p-4 rounded-xl opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <Link to={`/tracks/${req.track_id}`} className="font-semibold text-[var(--text-primary)] hover:text-primary-400 transition-colors text-sm">
                        "{req.track_title}"
                        </Link>
                        <p className="text-xs text-[var(--text-secondary)]">
                        by{' '}
                        <Link to={`/profile/${req.owner_id}`} className="text-primary-400 hover:text-primary-300">
                            {req.owner_name}
                        </Link>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {req.status === 'approved' && (
                        <Link
                            to={`/tracks/${req.track_id}/submissions`}
                            className="px-3 py-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg text-xs font-medium transition-all"
                        >
                            Submit Version →
                        </Link>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        req.status === 'approved'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                        {req.status}
                        </span>
                    </div>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    {new Date(req.updated_at || req.created_at).toLocaleDateString()}
                    </p>
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
            <Link to="/discover" className="text-primary-400 hover:text-primary-300 font-medium text-sm">
                Explore tracks to collaborate →
            </Link>
            </div>
        )}
        </div>
    )}
    </div>
</div>
);
}

export default CollaborationsPage;