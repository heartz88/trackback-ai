import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children }) {
const { user, loading } = useAuth();

if (loading) return (
            <div className="page-loading">
                <div className="music-loader">
                    <div className="music-loader-bar"></div>
                    <div className="music-loader-bar"></div>
                    <div className="music-loader-bar"></div>
                    <div className="music-loader-bar"></div>
                    <div className="music-loader-bar"></div>
                </div>
                <p className="mt-4 text-secondary animate-pulse">Loading...</p>
            </div>
);
if (!user) return <Navigate to="/login" />;

return children;
}

export default ProtectedRoute;