import { useEffect, useState } from 'react';
import { useToast } from '../components/common/Toast';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export function useCollaborations() {
const [received, setReceived] = useState([]);
const [sent, setSent] = useState([]);
const [history, setHistory] = useState({ received: [], sent: [] });
const [loading, setLoading] = useState(true);
const toast = useToast();
const { on } = useSocket();

useEffect(() => {
const fetch = async () => {
    try {
    setLoading(true);
    const [recRes, sentRes] = await Promise.all([
        api.get('/collaborations/requests/received'),
        api.get('/collaborations/requests/sent'),
    ]);
    const allRec  = recRes.data.requests  || [];
    const allSent = sentRes.data.requests || [];
    setReceived(allRec.filter(r => r.status === 'pending'));
    setSent(allSent.filter(r => r.status === 'pending'));
    setHistory({
        received: allRec.filter(r => r.status !== 'pending'),
        sent:     allSent.filter(r => r.status !== 'pending'),
    });
    } catch (err) {
    console.error('Failed to fetch requests:', err);
    } finally {
    setLoading(false);
    }
};
fetch();
}, []);

useEffect(() => {
const unsubReq = on('collaboration:request', (data) => {
    setReceived(prev => {
    if (prev.some(r => r.id === data.requestId)) return prev;
    return [{ id: data.requestId, track_id: data.trackId, track_title: data.trackTitle,
        collaborator_name: data.requesterName, message: data.message,
        status: 'pending', created_at: data.timestamp }, ...prev];
    });
    toast.success(`New collaboration request from ${data.requesterName}!`);
});

const unsubRes = on('collaboration:response', (data) => {
    setSent(prev => prev.filter(r => r.id !== data.requestId));
    setHistory(prev => ({
    ...prev,
    sent: [...prev.sent, { id: data.requestId, track_title: data.trackTitle,
        status: data.status, updated_at: data.timestamp }],
    }));
    if (data.status === 'approved') toast.success(`Your request for "${data.trackTitle}" was approved!`);
    else toast.error(`Your request for "${data.trackTitle}" was declined`);
});

return () => { unsubReq(); unsubRes(); };
}, [on]);

const handleResponse = async (requestId, status) => {
try {
    await api.put(`/collaborations/requests/${requestId}`, { status });
    const req = received.find(r => r.id === requestId);
    setReceived(prev => prev.filter(r => r.id !== requestId));
    if (req) setHistory(prev => ({ ...prev, received: [...prev.received, { ...req, status }] }));
    toast.success(`Request ${status === 'approved' ? 'approved! ✅' : 'declined'}`);
} catch {
    toast.error('Action failed — please try again');
}
};

const handleCancel = async (requestId) => {
try {
    await api.delete(`/collaborations/requests/${requestId}`);
    const req = sent.find(r => r.id === requestId);
    setSent(prev => prev.filter(r => r.id !== requestId));
    if (req) setHistory(prev => ({ ...prev, sent: [...prev.sent, { ...req, status: 'cancelled' }] }));
    toast.success('Request cancelled');
} catch (err) {
    toast.error(err.response?.data?.error?.message || 'Failed to cancel');
}
};

return { received, sent, history, loading, handleResponse, handleCancel };
}