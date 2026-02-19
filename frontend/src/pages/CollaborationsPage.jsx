import { useEffect, useState } from 'react';
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
    api.get('/collaborations/requests/sent')
]);

// Split into pending and history
const allReceived = receivedRes.data.requests || [];
const allSent = sentRes.data.requests || [];

setReceived(allReceived.filter(r => r.status === 'pending'));
setHistory({
    received: allReceived.filter(r => r.status !== 'pending'),
    sent: allSent.filter(r => r.status !== 'pending')
});

setSent(allSent.filter(r => r.status === 'pending'));
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

// Find and move the request to history
const respondedRequest = received.find(r => r.id === requestId);
setReceived(received.filter(r => r.id !== requestId));

if (respondedRequest) {
setHistory({
    ...history,
    received: [...history.received, { ...respondedRequest, status }]
});
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
            activeTab === 'pending'
                ? 'bg-primary-600 text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
    >
        Pending
        {(received.length + sent.length) > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {received.length + sent.length}
            </span>
        )}
    </button>
    <button
        onClick={() => setActiveTab('history')}
        className={`px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'history'
                ? 'bg-primary-600 text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
    >
        History
        {(history.received.length + history.sent.length) > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs rounded-full">
                {history.received.length + history.sent.length}
            </span>
        )}
    </button>
</div>

{activeTab === 'pending' ? (
    /* ===== PENDING TAB ===== */
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Received Requests - Pending */}
        <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                Received Requests
                {received.length > 0 && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">
                        {received.length} pending
                    </span>
                )}
            </h2>
            <div className="space-y-4">
                {received.map((req) => (
                    <div key={req.id} className="glass-panel p-6 rounded-2xl border-l-4 border-l-yellow-500">
                        <div className="flex items-start space-x-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-lg">
                                    {req.collaborator_name?.[0]?.toUpperCase() || '?'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-[var(--text-primary)] font-semibold mb-1">
                                    {req.collaborator_name}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    wants to collaborate on <span className="text-primary-400">"{req.track_title}"</span>
                                </p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium">
                                Pending
                            </span>
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm mb-4 bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-color)]">
                            {req.message}
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => handleResponse(req.id, 'approved')}
                                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-all"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => handleResponse(req.id, 'rejected')}
                                className="flex-1 py-2.5 bg-[var(--bg-tertiary)] hover:opacity-80 text-[var(--text-primary)] font-semibold rounded-xl transition-all"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                ))}
                {received.length === 0 && (
                    <div className="text-center py-12 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)]">
                        <p className="text-[var(--text-secondary)]">No pending requests</p>
                    </div>
                )}
            </div>
        </div>

        {/* Sent Requests - Pending */}
        <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                Sent Requests
                {sent.length > 0 && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">
                        {sent.length} pending
                    </span>
                )}
            </h2>
            <div className="space-y-4">
                {sent.map((req) => (
                    <div key={req.id} className="glass-panel p-6 rounded-2xl border-l-4 border-l-yellow-500">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-[var(--text-primary)] font-semibold mb-1">
                                    "{req.track_title}"
                                </p>
                                <p className="text-sm text-[var(--text-secondary)]">by {req.owner_name}</p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-medium">
                                Pending
                            </span>
                        </div>
                        {req.message && (
                            <p className="text-[var(--text-secondary)] text-sm mt-2 p-2 bg-[var(--bg-tertiary)] rounded-lg">
                                {req.message}
                            </p>
                        )}
                    </div>
                ))}
                {sent.length === 0 && (
                    <div className="text-center py-12 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)]">
                        <p className="text-[var(--text-secondary)]">No sent requests</p>
                    </div>
                )}
            </div>
        </div>
    </div>
) : (
    /* ===== HISTORY TAB ===== */
    <div className="space-y-8">
        {/* Received History */}
        {history.received.length > 0 && (
            <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Received History</h2>
                <div className="space-y-3">
                    {history.received.map((req) => (
                        <div key={req.id} className="glass-panel p-4 rounded-xl opacity-75 hover:opacity-100 transition-opacity">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-[var(--text-primary)]">
                                        {req.collaborator_name}
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        on "{req.track_title}"
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    req.status === 'approved'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                }`}>
                                    {req.status}
                                </span>
                            </div>
                            <p className="text-xs text-[var(--text-tertiary)] mt-2">
                                {new Date(req.updated_at || req.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Sent History */}
        {history.sent.length > 0 && (
            <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Sent History</h2>
                <div className="space-y-3">
                    {history.sent.map((req) => (
                        <div key={req.id} className="glass-panel p-4 rounded-xl opacity-75 hover:opacity-100 transition-opacity">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-[var(--text-primary)]">
                                        "{req.track_title}"
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        by {req.owner_name}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    req.status === 'approved'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                }`}>
                                    {req.status}
                                </span>
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
                <p className="text-[var(--text-secondary)]">Your past collaborations will appear here</p>
            </div>
        )}
    </div>
)}
</div>
</div>
);
}

export default CollaborationsPage;