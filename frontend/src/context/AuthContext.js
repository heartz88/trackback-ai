import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
const [token, setToken] = useState(null);

const decodeToken = (token) => {
    try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
    } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
    }
};

const isTokenExpired = (token) => {
    if (!token) return true;
    
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    // Check if token expires in less than 5 minutes
    const expiresIn = decoded.exp * 1000 - Date.now();
    return expiresIn < 5 * 60 * 1000;
};

// Refresh token before it expires
const refreshToken = useCallback(async () => {
    try {
    const currentToken = localStorage.getItem('token');
    
    if (!currentToken || isTokenExpired(currentToken)) {
        logout();
        return null;
    }

    
    // Call backend to get a new token
    const response = await api.post('/auth/refresh', {}, {
        headers: {
        Authorization: `Bearer ${currentToken}`
        }
    });

    const newToken = response.data.token;
    const userData = response.data.user;

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);

    return newToken;
    } catch (error) {
    console.error('Token refresh failed:', error);
    
    // If refresh fails, log out the user
    if (error.response?.status === 401) {
        logout();
    }
    
    return null;
    }
}, []);

// Load user from localStorage on initial mount
useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
    // Check if token is still valid
    if (isTokenExpired(storedToken)) {
        console.log('⚠️ Stored token is expired, logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    } else {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // Fetch fresh user data to get updated avatar URL (signed URLs expire)
        const fetchFreshUser = async () => {
            try {
                const response = await api.get(`/users/${parsedUser.id}`);
                if (response.data.user) {
                    const freshUser = response.data.user;
                    localStorage.setItem('user', JSON.stringify(freshUser));
                    setUser(freshUser);
                }
            } catch (error) {
                console.error('Failed to fetch fresh user data:', error);
                // If fetch fails, keep using stored user data
            }
        };
        
        fetchFreshUser();
    }
    }

    setLoading(false);
}, []);

// Set up automatic token refresh interval
useEffect(() => {
    if (!token) return;

    // Check token every minute
    const interval = setInterval(() => {
    const currentToken = localStorage.getItem('token');
    
    if (currentToken && isTokenExpired(currentToken)) {
        refreshToken();
    }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
}, [token, refreshToken]);

const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
};

// Function to manually refresh user data (can be called after avatar upload)
const refreshUserData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
        const response = await api.get(`/users/${user.id}`);
        if (response.data.user) {
            const freshUser = response.data.user;
            localStorage.setItem('user', JSON.stringify(freshUser));
            setUser(freshUser);
            return freshUser;
        }
    } catch (error) {
        console.error('Failed to refresh user data:', error);
    }
}, [user?.id]);

return (
    <AuthContext.Provider value={{
        user,
        token,
        login,
        logout,
        loading,
        refreshToken,
        refreshUserData
    }}>
    {children}
    </AuthContext.Provider>
);
}

export function useAuth() {
const context = useContext(AuthContext);
if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
}
return context;
}