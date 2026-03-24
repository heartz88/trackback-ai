import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children }) {
const { user, loading } = useAuth();
const location = useLocation();

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

// If not authenticated, redirect to login with return path
if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
}

return children;
}

export default ProtectedRoute;