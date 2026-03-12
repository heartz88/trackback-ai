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

// Get token expiry time in milliseconds
const getTokenExpiryTime = (token) => {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return 0;
    return decoded.exp * 1000;
};

// Refresh token before it expires
const refreshToken = useCallback(async () => {
    try {
    const currentToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    
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
    const isRememberMe = !!localStorage.getItem('token'); // Check if originally stored in localStorage

    if (isRememberMe) {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
    } else {
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('user', JSON.stringify(userData));
    }
    
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

// Load user from storage on initial mount
useEffect(() => {
    // Check both localStorage and sessionStorage
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const isRememberMe = !!localStorage.getItem('token');

    if (storedToken && storedUser) {
    // Check if token is still valid
    if (isTokenExpired(storedToken)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
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
                    if (isRememberMe) {
                        localStorage.setItem('user', JSON.stringify(freshUser));
                    } else {
                        sessionStorage.setItem('user', JSON.stringify(freshUser));
                    }
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

// Set up automatic token refresh interval with dynamic timing based on token expiry
useEffect(() => {
    if (!token) return;

    // Calculate when to check based on token expiry
    const checkToken = () => {
        const currentToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (currentToken) {
            const expiryTime = getTokenExpiryTime(currentToken);
            const timeUntilExpiry = expiryTime - Date.now();
            
            // If token expires in less than 1 hour, check more frequently
            const checkInterval = timeUntilExpiry < 60 * 60 * 1000 ? 60000 : 300000; // 1 min vs 5 mins
            
            if (isTokenExpired(currentToken)) {
                refreshToken();
            }
            
            return checkInterval;
        }
        return 60000; // Default to 1 minute
    };

    let interval = setInterval(() => {
        const nextInterval = checkToken();
        // Reschedule with new interval if needed
        clearInterval(interval);
        interval = setInterval(checkToken, nextInterval);
    }, checkToken());

    return () => clearInterval(interval);
}, [token, refreshToken]);

// login function with rememberMe parameter
const login = (newToken, userData, rememberMe = false) => {
    if (rememberMe) {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
    } else {
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('user', JSON.stringify(userData));
    }
    setToken(newToken);
    setUser(userData);
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
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
            const isRememberMe = !!localStorage.getItem('token');
            
            if (isRememberMe) {
                localStorage.setItem('user', JSON.stringify(freshUser));
            } else {
                sessionStorage.setItem('user', JSON.stringify(freshUser));
            }
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