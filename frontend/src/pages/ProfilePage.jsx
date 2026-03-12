import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProfileBanner from '../components/profile/ProfileBanner';
import ProfileCollaborations from '../components/profile/ProfileCollaborations';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileLoading from '../components/profile/ProfileLoading';
import ProfileNotFound from '../components/profile/ProfileNotFound';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfileTracks from '../components/profile/ProfileTracks';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ProfilePage() {
  const { username: usernameParam } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracks');

  const isOwnProfile = !usernameParam ||
    currentUser?.username?.toLowerCase() === usernameParam?.toLowerCase();

  useEffect(() => {
    // Don't fetch if usernameParam is explicitly undefined and no user is logged in
    if (usernameParam === 'undefined' || (!usernameParam && !currentUser)) {
      navigate('/');
      return;
    }
    fetchProfileData();
  }, [usernameParam, currentUser, navigate]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      let profileData;
      if (usernameParam && usernameParam !== 'undefined') {
        const res = await api.get(`/users/by-username/${usernameParam}`);
        profileData = res.data.user;
      } else if (currentUser?.id) {
        const res = await api.get(`/users/${currentUser.id}`);
        profileData = res.data.user;
      } else {
        setLoading(false);
        return;
      }
      setProfile(profileData);

      const [tracksRes, collabRes] = await Promise.allSettled([
        api.get(`/tracks/user/${profileData.id}`),
        api.get(`/collaborations/user/${profileData.id}`),
      ]);
      setTracks(tracksRes.status === 'fulfilled' ? tracksRes.value.data.tracks || [] : []);
      setCollaborations(collabRes.status === 'fulfilled' ? collabRes.value.data.collaborations || [] : []);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ProfileLoading />;
  if (!profile) return <ProfileNotFound />;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <ProfileBanner />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-16 relative z-10">
        <ProfileHeader 
          profile={profile}
          isOwnProfile={isOwnProfile}
          currentUser={currentUser}
          tracksCount={tracks.length}
          collaborationsCount={collaborations.length}
        />

        <ProfileTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tracksCount={tracks.length}
          collaborationsCount={collaborations.length}
        />

        {activeTab === 'tracks' && (
          <ProfileTracks 
            tracks={tracks}
            isOwnProfile={isOwnProfile}
          />
        )}

        {activeTab === 'collabs' && (
          <ProfileCollaborations 
            collaborations={collaborations}
            profile={profile}
            currentUser={currentUser}
            isOwnProfile={isOwnProfile}
          />
        )}
      </div>
    </div>
  );
}

export default ProfilePage;