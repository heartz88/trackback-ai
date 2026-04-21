import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirm, useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export function useTrackDetail(trackSlug) {
const { user } = useAuth();
const navigate = useNavigate();
const toast = useToast();
const confirm = useConfirm();

const [track, setTrack] = useState(null);
const [owner, setOwner] = useState(null);
const [collaboration, setCollaboration] = useState(null);
const [collaborators, setCollaborators] = useState([]);
const [submissionsCount, setSubmissionsCount] = useState(0);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');
const [requestingCollab, setRequestingCollab] = useState(false);
const [collabMessage, setCollabMessage] = useState('');
const [showMessageInput, setShowMessageInput] = useState(false);
const [isPlaying, setIsPlaying] = useState(false);

useEffect(() => { fetchTrackDetails(); }, [trackSlug]);

const fetchTrackDetails = async () => {
setIsLoading(true);
setError('');
try {
    const trackRes = await api.get(`/tracks/by-slug/${trackSlug}`);
    const t = trackRes.data.track;
    setTrack(t);

    const ownerRes = await api.get(`/users/${t.user_id}`);
    setOwner(ownerRes.data.user);

    try {
    const r = await api.get(`/submissions/track/${t.id}`);
    setSubmissionsCount(r.data.submissions?.length || 0);
    } catch { setSubmissionsCount(0); }

    try {
    const r = await api.get(`/collaborations/track/${t.id}/active`);
    setCollaborators(r.data.collaborators || []);
    } catch { setCollaborators([]); }

    if (user) {
    try {
        const r = await api.get(`/collaborations/track/${t.id}`);
        setCollaboration(r.data.collaboration);
    } catch { setCollaboration(null); }
    }
} catch (err) {
    console.error('Failed to load track:', err);
    setError('Failed to load track');
} finally {
    setIsLoading(false);
}
};

const handleRequestCollaboration = async () => {
if (!user) { navigate('/login'); return; }
if (!showMessageInput) { setShowMessageInput(true); return; }
setRequestingCollab(true);
try {
    const r = await api.post('/collaborations/request', {
    track_id: track.id,
    message: collabMessage || `I'd like to collaborate on "${track.title}"`,
    });
    setCollaboration(r.data.request);
    setShowMessageInput(false);
    toast.success('Collaboration request sent!');
} catch (err) {
    toast.error(err.response?.data?.error?.message || 'Failed to send request');
} finally {
    setRequestingCollab(false);
}
};

const handleCompleteTrack = async () => {
const ok = await confirm({
    title: 'Mark track as completed?',
    message: 'The highest voted submission will be selected as the winning version. Collaborations will be closed and no new submissions can be made.',
    confirmText: 'Complete Track',
});
if (!ok) return;
try {
    await api.post(`/tracks/${track.id}/complete`);
    fetchTrackDetails();
    toast.success('Track marked as completed! 🎉');
} catch (err) {
    toast.error(err.response?.data?.error?.message || 'Failed to complete track');
}
};

const handlePlay  = useCallback(() => setIsPlaying(true),  []);
const handlePause = useCallback(() => setIsPlaying(false), []);

const isOwner           = user && track && user.id === track.user_id;
const isCompleted       = track?.status === 'completed';
const hasApprovedCollab = collaboration?.status === 'approved';
const canRequestCollab  = user && !isOwner && !collaboration && !isCompleted;

return {
track, owner, collaboration, collaborators,
submissionsCount, isLoading, error,
requestingCollab, collabMessage, setCollabMessage,
showMessageInput, setShowMessageInput,
isPlaying, handlePlay, handlePause,
isOwner, isCompleted, hasApprovedCollab, canRequestCollab,
handleRequestCollaboration, handleCompleteTrack,
};
}