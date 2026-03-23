import ProfileActions from './ProfileActions';
import ProfileBio from './ProfileBio';
import ProfileEquipment from './ProfileEquipment';
import ProfileGenres from './ProfileGenres';
import ProfileMeta from './ProfileMeta';
import ProfileSkills from './ProfileSkills';
import ProfileStats from './ProfileStats';
import SocialLinks from './SocialLinks';

const CollaborationIcon = () => (
<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
</svg>
);

export default function ProfileHeader({ 
profile, 
isOwnProfile, 
currentUser,
tracksCount,
collaborationsCount 
}) {
return (
<div className="glass-panel rounded-3xl p-8 mb-8 hover:border-primary-500/30 transition-[box-shadow,border-color]">
    <div className="flex flex-col lg:flex-row gap-8">
    {/* Avatar */}
    <div className="flex-shrink-0 text-center lg:text-left">
        <div className="relative inline-block">
        {profile.avatar_url ? (
            <img 
            src={profile.avatar_url} 
            alt={profile.username}
            className="w-32 h-32 lg:w-36 lg:h-36 rounded-full object-cover border-4 border-white/20 shadow-2xl" 
            onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
            }}
            />
        ) : null}
        {(!profile.avatar_url || profile.avatar_error) && (
            <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-5xl font-bold border-4 border-white/20 shadow-2xl">
            {profile.username?.[0]?.toUpperCase() || '?'}
            </div>
        )}
        {profile.looking_for_collab && (
            <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-4 border-[var(--bg-primary)] shadow-lg animate-pulse">
            <CollaborationIcon />
            </div>
        )}
        </div>
    </div>

    {/* Info */}
    <div className="flex-1">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            {profile.username}
            </h1>
            <ProfileMeta 
            created_at={profile.created_at}
            last_active={profile.last_active}
            looking_for_collab={profile.looking_for_collab}
            />
        </div>
        <ProfileActions 
            isOwnProfile={isOwnProfile}
            profile={profile}
            currentUser={currentUser}
        />
        </div>

        {profile.bio && <ProfileBio bio={profile.bio} />}
        {profile.skills?.length > 0 && <ProfileSkills skills={profile.skills} />}
        {profile.preferred_genres?.length > 0 && <ProfileGenres genres={profile.preferred_genres} />}
        {profile.equipment?.length > 0 && <ProfileEquipment equipment={profile.equipment} />}
        {profile.social_links && <SocialLinks links={profile.social_links} />}
        <ProfileStats tracksCount={tracksCount} collaborationsCount={collaborationsCount} />
    </div>
    </div>
</div>
);
}