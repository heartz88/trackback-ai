import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children }) {
const { user, loading } = useAuth();

if (loading) return (
<div className="flex justify-center items-center h-screen bg-[var(--bg-primary)]">
    <div className="animate-pulse">
    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
</div>
);
if (!user) return <Navigate to="/login" />;

return children;
}

export default ProtectedRoute;