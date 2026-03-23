import { Link } from 'react-router-dom';

export default function ProfileCollaborations({ collaborations, profile, currentUser, isOwnProfile }) {
if (collaborations.length === 0) {
return (
    <div className="text-center py-20 glass-panel rounded-3xl">
    <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    </div>
    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Collaborations Yet</h3>
    <p className="text-[var(--text-secondary)] mb-4">
        {isOwnProfile ? 'Explore tracks to find collaboration opportunities' : "This user hasn't collaborated yet"}
    </p>
    {isOwnProfile && (
        <Link 
        to="/discover" 
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20"
        >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Discover Tracks
        </Link>
    )}
    </div>
);
}

return (
<div className="space-y-3">
    {collaborations.map(collab => {
    const isOwnerOfTrack = collab.owner_id === profile.id;
    const otherPersonName = isOwnerOfTrack ? collab.collaborator_name : collab.owner_name;
    const otherPersonId = isOwnerOfTrack ? collab.collaborator_id : collab.owner_id;

    return (
        <div 
        key={collab.id} 
        className="glass-panel p-4 rounded-xl hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/5"
        >
        <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
            <Link to={`/profile/${otherPersonName}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                {otherPersonName?.[0]?.toUpperCase() || '?'}
                </div>
            </Link>
            <div>
                <div className="flex items-center gap-2">
                <Link 
                    to={`/profile/${otherPersonName}`} 
                    className="font-semibold text-[var(--text-primary)] hover:text-primary-400 transition-colors text-sm"
                >
                    {otherPersonName}
                </Link>
                <span className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] text-xs rounded border border-[var(--border-color)]">
                    {isOwnerOfTrack ? 'their collab' : 'your collab'}
                </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {isOwnerOfTrack ? 'collaborated on ' : 'collaborating on '}
                <Link 
                    to={`/tracks/${collab.track_id}`} 
                    className="text-primary-400 hover:text-primary-300 font-medium"
                >
                    "{collab.track_title}"
                </Link>
                </p>
            </div>
            </div>
            <div className="flex items-center gap-2">
            <Link 
                to={`/tracks/${collab.track_id}/submissions`} 
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium transition-all"
            >
                Submissions
            </Link>
            {currentUser && !isOwnProfile && (
                <Link 
                to={`/messages/new?userId=${otherPersonId}`} 
                className="px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-tertiary)] hover:text-primary-400 rounded-lg text-xs font-medium transition-all border border-[var(--border-color)]"
                >
                Message
                </Link>
            )}
            <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
                {collab.status || 'Active'}
            </span>
            </div>
        </div>
        </div>
    );
    })}
</div>
);
}