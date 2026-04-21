import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirm, useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export function useSubmissionsPage(trackSlug) {
const { user } = useAuth();
const { on } = useSocket();
const navigate = useNavigate();
const toast = useToast();
const confirm = useConfirm();

const [trackId, setTrackId] = useState(null);
const trackIdRef = useRef(null);
const [track, setTrack] = useState(null);
const [owner, setOwner] = useState(null);
const [collaboration, setCollaboration] = useState(null);
const [submissions, setSubmissions] = useState([]);
const [showSubmitForm, setShowSubmitForm] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [submissionsLoading, setSubmissionsLoading] = useState(true);
const [error, setError] = useState('');
const [refreshKey, setRefreshKey] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);

useEffect(() => { fetchTrackDetails(); }, [trackSlug]);
useEffect(() => { if (trackId) { fetchCollaboration(); fetchSubmissions(); } }, [trackId, refreshKey, user]);

useEffect(() => {
const unsubSubmission = on('submission:new', (data) => {
    if (data.trackId?.toString() !== trackId?.toString()) return;
    setRefreshKey(k => k + 1);
    toast.success(`🎵 ${data.collaboratorName || 'Someone'} submitted a new version!`);
});
const unsubVote = on('vote:new', (data) => {
    if (data.trackId?.toString() !== trackId?.toString()) return;
    setSubmissions(prev => prev.map(s =>
    s.id?.toString() === data.submissionId?.toString()
        ? { ...s, upvotes: (parseInt(s.upvotes) || 0) + 1 }
        : s
    ));
});
return () => { unsubSubmission(); unsubVote(); };
}, [on, trackId]);

const fetchTrackDetails = async () => {
setIsLoading(true);
setError('');
try {
    const res = await api.get(`/tracks/by-slug/${trackSlug}`);
    const id = res.data.track.id;
    setTrackId(id);
    trackIdRef.current = id;
    setTrack(res.data.track);
    try {
    const ownerRes = await api.get(`/users/${res.data.track.user_id}`);
    setOwner(ownerRes.data.user);
    } catch {}
} catch {
    setError('Failed to load track');
} finally {
    setIsLoading(false);
}
};

const fetchCollaboration = async () => {
if (!user) return;
try {
    const res = await api.get(`/collaborations/track/${trackId}`);
    if (res.data.collaboration) setCollaboration(res.data.collaboration);
} catch {}
};

const fetchSubmissions = async () => {
if (!user) { setSubmissionsLoading(false); return; }
const id = trackIdRef.current;
if (!id) { setSubmissionsLoading(false); return; }
setSubmissionsLoading(true);
try {
    const res = await api.get(`/collaborations/${id}/submissions`);
    setSubmissions(res.data.submissions || []);
} catch {
    try {
    const res = await api.get(`/submissions/track/${id}`);
    setSubmissions(res.data.submissions || []);
    } catch { setSubmissions([]); }
} finally {
    setSubmissionsLoading(false);
}
};

const handleSubmissionSuccess = () => {
setShowSubmitForm(false);
setRefreshKey(k => k + 1);
toast.success('Submission uploaded! 🎵');
};

const handleCompleteTrack = async () => {
const ok = await confirm({
    title: 'Mark as completed?',
    message: 'The highest voted submission will be selected as the final version.',
    confirmText: 'Complete Track',
});
if (!ok) return;
try {
    await api.post(`/collaborations/${trackIdRef.current}/complete`);
    toast.success('Track marked as completed!');
    navigate(`/tracks/${trackSlug}`);
} catch (err) {
    toast.error(err.response?.data?.error?.message || 'Failed to complete track');
}
};

const handlePlay  = useCallback(() => setIsPlaying(true),  []);
const handlePause = useCallback(() => setIsPlaying(false), []);

const totalVotes    = submissions.reduce((acc, s) => acc + (parseInt(s.upvotes) || 0), 0);
const topSubmission = submissions.length > 0
? submissions.reduce((best, s) => (parseInt(s.upvotes) || 0) > (parseInt(best.upvotes) || 0) ? s : best)
: null;
const topScore      = topSubmission ? parseInt(topSubmission.upvotes) || 0 : 0;
const mySubmissions = user ? submissions.filter(s => s.collaborator_id === user.id) : [];
const isOwner       = user && track && user.id === track.user_id;
const canSubmit     = collaboration?.status === 'approved';

return {
track, owner, collaboration, submissions,
trackId: trackIdRef.current || trackId,
isLoading, submissionsLoading, error,
showSubmitForm, setShowSubmitForm,
isPlaying, handlePlay, handlePause,
totalVotes, topScore, mySubmissions,
isOwner, canSubmit,
handleSubmissionSuccess, handleCompleteTrack,
};
}