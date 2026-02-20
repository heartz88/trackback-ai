import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SubmissionList from '../components/submissions/SubmissionList';
import WaveformPlayer from '../components/tracks/WaveformPlayer';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TrackDetailPage = () => {
const { trackId } = useParams();
const { user } = useAuth();
const navigate = useNavigate();
const [track, setTrack] = useState(null);
const [owner, setOwner] = useState(null);
const [collaboration, setCollaboration] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');
const [requestingCollab, setRequestingCollab] = useState(false);
const [collaborators, setCollaborators] = useState([]);
const [submissionsCount, setSubmissionsCount] = useState(0);
const [collabMessage, setCollabMessage] = useState('');
const [showMessageInput, setShowMessageInput] = useState(false);
const [isPlaying, setIsPlaying] = useState(false);
const [editingMetadata, setEditingMetadata] = useState(false);
const [metadataForm, setMetadataForm] = useState({ bpm: '', musical_key: '', energy_level: '', genre: '' });
const [savingMetadata, setSavingMetadata] = useState(false);
const [metadataSaved, setMetadataSaved] = useState(false);

useEffect(() => { fetchTrackDetails(); }, [trackId]);

const fetchTrackDetails = async () => {
setIsLoading(true);
setError('');
try {
    const trackRes = await api.get(`/tracks/${trackId}`);
    setTrack(trackRes.data.track);
    const ownerRes = await api.get(`/users/${trackRes.data.track.user_id}`);
    setOwner(ownerRes.data.user);
    try { const r = await api.get(`/submissions/track/${trackId}`); setSubmissionsCount(r.data.submissions?.length || 0); } catch { setSubmissionsCount(0); }
    try { const r = await api.get(`/collaborations/track/${trackId}/active`); setCollaborators(r.data.collaborators || []); } catch { setCollaborators([]); }
    if (user) { try { const r = await api.get(`/collaborations/track/${trackId}`); setCollaboration(r.data.collaboration); } catch { setCollaboration(null); } }
} catch { setError('Failed to load track'); } finally { setIsLoading(false); }
};

const handleRequestCollaboration = async () => {
if (!user) { navigate('/login'); return; }
if (!showMessageInput) { setShowMessageInput(true); return; }
setRequestingCollab(true);
try {
    const r = await api.post('/collaborations/request', { track_id: trackId, message: collabMessage || `I'd like to collaborate on "${track.title}"` });
    setCollaboration(r.data.request);
    setShowMessageInput(false);
} catch (err) { alert(err.response?.data?.error?.message || 'Failed to send request'); }
finally { setRequestingCollab(false); }
};

const handleCompleteTrack = async () => {
if (!window.confirm('Mark this track as completed?')) return;
try { await api.post(`/collaborations/${trackId}/complete`); fetchTrackDetails(); }
catch (err) { alert(err.response?.data?.error?.message || 'Failed'); }
};

const handlePlay  = useCallback(() => setIsPlaying(true), []);
const handlePause = useCallback(() => setIsPlaying(false), []);

const openEditMetadata = () => {
setMetadataForm({
    bpm: track.bpm ? Math.round(track.bpm) : '',
    musical_key: track.musical_key || '',
    energy_level: track.energy_level || '',
    genre: track.genre || '',
});
setEditingMetadata(true);
setMetadataSaved(false);
};

const handleSaveMetadata = async () => {
setSavingMetadata(true);
try {
    const payload = {};
    if (metadataForm.bpm !== '') payload.bpm = metadataForm.bpm;
    if (metadataForm.musical_key !== '') payload.musical_key = metadataForm.musical_key;
    if (metadataForm.energy_level !== '') payload.energy_level = metadataForm.energy_level;
    if (metadataForm.genre !== '') payload.genre = metadataForm.genre;

    const res = await api.put(`/tracks/${trackId}/metadata`, payload);
    setTrack(res.data.track);
    setEditingMetadata(false);
    setMetadataSaved(true);
    setTimeout(() => setMetadataSaved(false), 3000);
} catch (err) {
    alert(err.response?.data?.error?.message || 'Failed to save changes');
} finally {
    setSavingMetadata(false);
}
};

const isOwner = user && track && user.id === track.user_id;
const canRequestCollab = user && !isOwner && !collaboration;
const hasApprovedCollab = collaboration?.status === 'approved';
const energyClass = e => e === 'high' ? 'tdp-tag tdp-tag-energy-high' : e === 'medium' ? 'tdp-tag tdp-tag-energy-med' : 'tdp-tag tdp-tag-energy-low';

if (isLoading) return (
<div className="page-loading">
    <div className="music-loader">{[...Array(5)].map((_,i)=><div key={i} className="music-loader-bar"/>)}</div>
    <p style={{color:'var(--text-tertiary)',marginTop:16}} className="animate-pulse">Loading track…</p>
</div>
);
if (error || !track) return (
<div className="page-error animate-fade-in">
    <h2>Track Not Found</h2><p>{error||'This track does not exist'}</p>
    <Link to="/discover" className="btn-primary">Browse Tracks</Link>
</div>
);

return (
<div className="track-detail-page animate-fade-in">

    {/* Breadcrumb to make it easier for the user to go back to discover */}
    <nav className="breadcrumb animate-slide-up">
    <Link to="/discover">Discover</Link>
    <span className="breadcrumb-sep">›</span>
    <span className="breadcrumb-current">{track.title}</span>
    </nav>

    {/* Full-width player */}
    <div className="tdp-player-block animate-slide-up stagger-1">
    <WaveformPlayer audioUrl={track.audio_url} height={80} onPlay={handlePlay} onPause={handlePause} />
    </div>

    {/* Two-column grid */}
    <div className="tdp-grid">

    {/* Info */}
    <div className="tdp-info animate-slide-up stagger-2">
        <div className="tdp-title-row">
        <h1 className="tdp-title">{track.title}</h1>
        {isPlaying && <div className="eq-indicator" aria-label="Now playing"><span/><span/><span/><span/><span/></div>}
        </div>

        <div className="tdp-owner-row">
        <Link to={`/profile/${owner?.id}`} style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
            <div className="tdp-owner-avatar">{owner?.username?.charAt(0).toUpperCase()}</div>
            <div>
            <div className="tdp-owner-name">@{owner?.username}</div>
            <div className="tdp-owner-date">{new Date(track.created_at).toLocaleDateString()}</div>
            </div>
        </Link>
        {user && !isOwner && (
            <Link to={`/messages/new?userId=${owner?.id}`} className="tdp-message-btn">
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            Message
            </Link>
        )}
        </div>

        <div className="tdp-stats">
        {[{l:'Plays',v:track.plays||0},{l:'Submissions',v:submissionsCount},{l:'Collaborators',v:collaborators.length}].map(s=>(
            <div key={s.l} className="tdp-stat">
            <span className="tdp-stat-value">{s.v}</span>
            <span className="tdp-stat-label">{s.l}</span>
            </div>
        ))}
        </div>

        <div className="tdp-tags">
        {track.bpm && <span className="tdp-tag tdp-tag-bpm">🎵 {Math.round(track.bpm)} BPM</span>}
        {track.musical_key && <span className="tdp-tag tdp-tag-key">🎹 {track.musical_key}</span>}
        {track.energy_level && <span className={energyClass(track.energy_level)}>⚡ {track.energy_level}</span>}
        {track.genre && <span className="tdp-tag tdp-tag-genre">🎸 {track.genre}</span>}
        {isOwner && !editingMetadata && (
            <button onClick={openEditMetadata} style={{
            display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',
            background:'var(--surface-2)',border:'1px solid var(--surface-border)',
            borderRadius:'var(--radius-sm)',color:'var(--text-tertiary)',fontSize:11,
            cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'
            }}
            onMouseEnter={e=>{e.target.style.color='var(--accent-primary)';e.target.style.borderColor='var(--accent-primary)'}}
            onMouseLeave={e=>{e.target.style.color='var(--text-tertiary)';e.target.style.borderColor='var(--surface-border)'}}
            >
            ✏️ Correct AI values
            </button>
        )}
        {metadataSaved && <span style={{fontSize:11,color:'#22c55e',fontWeight:600}}>✓ Saved</span>}
        </div>

        {/* Inline metadata edit panel — owner only */}
        {isOwner && editingMetadata && (
        <div style={{
            marginTop:12,padding:16,background:'var(--surface-2)',
            border:'1px solid var(--accent-primary)',borderRadius:'var(--radius-md)',
        }}>
            <p style={{fontSize:11,color:'var(--text-tertiary)',marginBottom:12,marginTop:0}}>
            ✏️ Correct the AI-detected values below. Leave a field blank to keep the current value.
            </p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            {/* BPM */}
            <div>
                <label style={{fontSize:11,color:'var(--text-secondary)',display:'block',marginBottom:4}}>BPM</label>
                <input
                type="number" min="20" max="400" step="1"
                value={metadataForm.bpm}
                onChange={e=>setMetadataForm(f=>({...f,bpm:e.target.value}))}
                placeholder={track.bpm ? Math.round(track.bpm) : 'e.g. 140'}
                style={{width:'100%',boxSizing:'border-box',padding:'7px 10px',background:'var(--bg-primary)',border:'1px solid var(--surface-border)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',fontSize:13,fontFamily:'inherit'}}
                />
            </div>
            {/* Energy */}
            <div>
                <label style={{fontSize:11,color:'var(--text-secondary)',display:'block',marginBottom:4}}>Energy</label>
                <select
                value={metadataForm.energy_level}
                onChange={e=>setMetadataForm(f=>({...f,energy_level:e.target.value}))}
                style={{width:'100%',boxSizing:'border-box',padding:'7px 10px',background:'var(--bg-primary)',border:'1px solid var(--surface-border)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',fontSize:13,fontFamily:'inherit'}}
                >
                <option value="">Keep current ({track.energy_level || '—'})</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                </select>
            </div>
            {/* Key */}
            <div>
                <label style={{fontSize:11,color:'var(--text-secondary)',display:'block',marginBottom:4}}>Key</label>
                <input
                type="text"
                value={metadataForm.musical_key}
                onChange={e=>setMetadataForm(f=>({...f,musical_key:e.target.value}))}
                placeholder={track.musical_key || 'e.g. C# Minor'}
                style={{width:'100%',boxSizing:'border-box',padding:'7px 10px',background:'var(--bg-primary)',border:'1px solid var(--surface-border)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',fontSize:13,fontFamily:'inherit'}}
                />
            </div>
            {/* Genre */}
            <div>
                <label style={{fontSize:11,color:'var(--text-secondary)',display:'block',marginBottom:4}}>Genre</label>
                <input
                type="text"
                value={metadataForm.genre}
                onChange={e=>setMetadataForm(f=>({...f,genre:e.target.value}))}
                placeholder={track.genre || 'e.g. Hip Hop'}
                style={{width:'100%',boxSizing:'border-box',padding:'7px 10px',background:'var(--bg-primary)',border:'1px solid var(--surface-border)',borderRadius:'var(--radius-sm)',color:'var(--text-primary)',fontSize:13,fontFamily:'inherit'}}
                />
            </div>
            </div>
            <div style={{display:'flex',gap:8}}>
            <button onClick={handleSaveMetadata} disabled={savingMetadata} className="btn-primary" style={{flex:1}}>
                {savingMetadata ? 'Saving…' : '✓ Save Changes'}
            </button>
            <button onClick={()=>setEditingMetadata(false)} className="btn-secondary">
                Cancel
            </button>
            </div>
        </div>
        )}

        {track.description && (<>
        <hr className="tdp-divider"/>
        <div className="section-label">About</div>
        <p className="tdp-description">{track.description}</p>
        </>)}

        {track.desired_skills?.length > 0 && (<>
        <hr className="tdp-divider"/>
        <div className="section-label">🎯 Looking For</div>
        <div className="tdp-skills">{track.desired_skills.map((s,i)=><span key={i} className="tdp-skill">{s}</span>)}</div>
        </>)}
    </div>

    {/* Actions */}
    <div className="tdp-actions-panel animate-slide-up stagger-3">
        <div className="tdp-action-card">
        <div className="section-label">Collaborate</div>

        {!user && <Link to="/login" className="btn-primary" style={{textAlign:'center'}}>Login to Collaborate</Link>}

        {canRequestCollab && (<>
            {showMessageInput && (
            <textarea value={collabMessage} onChange={e=>setCollabMessage(e.target.value)}
                placeholder={`Tell ${owner?.username} why you'd like to collaborate...`} rows={3}
                style={{width:'100%',boxSizing:'border-box',padding:'10px 12px',background:'var(--surface-2)',border:'1px solid var(--surface-border)',borderRadius:'var(--radius-md)',color:'var(--text-primary)',fontSize:13,resize:'none',outline:'none',fontFamily:'inherit'}}
            />
            )}
            <button onClick={handleRequestCollaboration} className="btn-primary" disabled={requestingCollab} style={{width:'100%'}}>
            {requestingCollab ? 'Sending…' : showMessageInput ? '🤝 Send Request' : '🤝 Request Collaboration'}
            </button>
            {showMessageInput && <button onClick={()=>setShowMessageInput(false)} style={{background:'none',border:'none',color:'var(--text-tertiary)',fontSize:12,cursor:'pointer',padding:0}}>Cancel</button>}
        </>)}

        {collaboration?.status === 'pending'  && <div className="tdp-status-pending">⏳ Request Pending</div>}
        {collaboration?.status === 'rejected' && <div className="tdp-status-rejected">❌ Declined</div>}
        {collaboration?.status === 'approved' && (<>
            <div className="tdp-status-approved">✅ Collaboration Approved</div>
            <Link to={`/tracks/${trackId}/submissions`} className="btn-primary" style={{textAlign:'center'}}>➕ Submit Your Version</Link>
        </>)}

        {isOwner && (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <Link to="/my-tracks" className="btn-secondary" style={{textAlign:'center'}}>✏️ Manage My Tracks</Link>
            {submissionsCount > 0 && (<>
                <Link to={`/tracks/${trackId}/submissions`} className="btn-secondary" style={{textAlign:'center'}}>📋 Submissions ({submissionsCount})</Link>
                <button onClick={handleCompleteTrack} className="btn-secondary">✅ Mark as Completed</button>
            </>)}
            </div>
        )}

        {hasApprovedCollab && track.audio_url && (
            <a href={track.audio_url} download target="_blank" rel="noreferrer" className="btn-secondary" style={{textAlign:'center'}}>⬇ Download Track</a>
        )}
        </div>

        {collaborators.length > 0 && (
        <div className="tdp-action-card">
            <div className="section-label">🤝 Collaborators</div>
            <div className="tdp-collabs-list">
            {collaborators.map(c=>(
                <div key={c.id} className="tdp-collab-item">
                <div className="tdp-collab-avatar">{c.username?.charAt(0).toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                    <Link to={`/profile/${c.id}`} style={{color:'var(--text-primary)',fontWeight:600,fontSize:13,textDecoration:'none',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>@{c.username}</Link>
                    <span style={{color:'var(--text-tertiary)',fontSize:11}}>{c.role||'Collaborator'}</span>
                </div>
                {user && user.id !== c.id && <Link to={`/messages/new?userId=${c.id}`} className="tdp-message-btn" style={{marginLeft:0}}>Msg</Link>}
                </div>
            ))}
            </div>
        </div>
        )}
    </div>
    </div>

    {/* Submissions */}
    <div className="tdp-submissions animate-slide-up stagger-4">
    <div className="tdp-section-head">
        <h2 className="tdp-section-title">🏆 Submissions</h2>
        {submissionsCount > 0 && <Link to={`/tracks/${trackId}/submissions`} className="btn-view-all">View All ({submissionsCount}) →</Link>}
    </div>
    <SubmissionList trackId={trackId} limit={3} />
    {submissionsCount === 0 && (
        <div style={{textAlign:'center',padding:'32px 0',color:'var(--text-tertiary)',fontSize:14}}>
        No submissions yet.{' '}{hasApprovedCollab && <Link to={`/tracks/${trackId}/submissions`} style={{color:'var(--accent-primary)'}}>Be the first!</Link>}
        </div>
    )}
    </div>
</div>
);
};

export default TrackDetailPage;