import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function ProfilePage() {
    const { userid } = useParams();
    const {user: currentUser} = useAuth();
    const [profile, setProfile] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("tracks");
    const isOwnProfile = !userid || currentUser?.id.toString() === userid;

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                // Determine which profile to fetch: either the userid from params or the current user's id
                const profileId = userid || currentUser?.id;

                // What this constant does is fetch the profile data of the user from the api
                const profileRes = await api.get(`/users/${profileId}`);
                setProfile(profileRes.data.user);

                // What this constant does is fetch the tracks of the user from the api
                const tracksRes = await api.get(`/users/${profileId}/tracks`);
                setTracks(tracksRes.data.tracks || []);

                // What this constant does is fetch the collaborations of the user from the api
                const collaborationsRes = await api.get(`/users/${profileId}/collaborations`);
                setActiveCollabs(collaborationsRes.data.tracks || []);
            }
            catch (error) {
                console.error("Error fetching profile data:", error);
            }
            finally {setLoading(false);
            }
        };
        if (currentUser){
            fetchProfile();
        }
    }, [userid, currentUser]);

    // This function formats the date to a more readable format
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric', day: '2-digit'});
    };

    // This part handles the loading state and error state
    if (loading){
        return (<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin">
            </div>
        </div>
        );
    }

    // This part handles the case when the profile is not found
    if (!profile){
        return (<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800">Profile Not Found</h2>
                <p className="mt-2 text-gray-600">The profile you are looking for does not exist.</p>
                <Link to="/" className="mt-4 inline-block text-primary-500 hover:underline">Go back to the home page</Link>
            </div>
        </div>);
    }


}