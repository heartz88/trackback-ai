import { useEffect, useState } from 'react';
import api from '../services/api';

function CollaborationsPage() {
const [received, setReceived] = useState([]);
const [sent, setSent] = useState([]);

useEffect(() => {
const fetchRequests = async () => {
    try {
    const [receivedRes, sentRes] = await Promise.all([
        api.get('/collaborations/requests/received'),
        api.get('/collaborations/requests/sent')
    ]);
    setReceived(receivedRes.data.requests);
    setSent(sentRes.data.requests);
    } catch (err) {
    console.error('Failed to fetch requests:', err);
    }
};
fetchRequests();
}, []);

const handleResponse = async (requestId, status) => {
try {
    await api.put(`/collaborations/requests/${requestId}`, { status });
    setReceived(received.filter(r => r.id !== requestId));
    alert(`Request ${status}!`);
} catch (err) {
    alert('Action failed');
}
};

return (
<div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4 transition-colors duration-300">
    <div className="max-w-7xl mx-auto">
    <div className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">Collaborations</h1>
        <p className="text-[var(--text-secondary)]">Manage your collaboration requests</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Received Requests</h2>
        <div className="space-y-4">
            {received.map((req) => (
            <div key={req.id} className="glass-panel p-6 rounded-2xl">
                <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">{req.collaborator_name[0].toUpperCase()}</span>
                </div>
                <div className="flex-1">
                    <p className="text-[var(--text-primary)] font-semibold mb-1">
                    {req.collaborator_name}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                    wants to collaborate on <span className="text-primary-400">"{req.track_title}"</span>
                    </p>
                </div>
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

        <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Sent Requests</h2>
        <div className="space-y-4">
            {sent.map((req) => (
            <div key={req.id} className="glass-panel p-6 rounded-2xl">
                <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-[var(--text-primary)] font-semibold mb-1">
                    "{req.track_title}"
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">by {req.owner_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${req.status === 'approved'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                    : req.status === 'rejected'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                    }`}>
                    {req.status}
                </span>
                </div>
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
    </div>
</div>
);
}

export default CollaborationsPage;