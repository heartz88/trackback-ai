import { Link } from 'react-router-dom';

export default function ProfileActions({ isOwnProfile, profile, currentUser }) {
if (isOwnProfile) {
return (
    <div className="flex gap-2 flex-wrap">
    <Link 
        to="/edit-profile" 
        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-primary-500/10 text-[var(--text-primary)] hover:text-primary-400 rounded-xl transition-[box-shadow,border-color] border border-[var(--border-color)] text-sm font-medium"
    >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Edit Profile
    </Link>
    <Link 
        to="/upload" 
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-[box-shadow,border-color] text-sm font-medium shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40"
    >
        + Upload Track
    </Link>
    </div>
);
}

if (currentUser) {
return (
    <Link 
    to={`/messages/new?userId=${profile.id}`} 
    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-[box-shadow,border-color] text-sm font-medium shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40"
    >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
    Message
    </Link>
);
}

return null;
}