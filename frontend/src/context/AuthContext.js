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
    return expiresIn < 5 * 60 * 1000; // 5 minutes buffer
};

// ✅ FIXED: Refresh token before it expires
const refreshToken = useCallback(async () => {
    try {
    const currentToken = localStorage.getItem('token');
    
    if (!currentToken || isTokenExpired(currentToken)) {
        console.log('🔄 Token expired, logging out...');
        logout();
        return null;
    }

    console.log('🔄 Refreshing token...');
    
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

    console.log('✅ Token refreshed successfully');
    return newToken;
    } catch (error) {
    console.error('❌ Token refresh failed:', error);
    
    // If refresh fails, log out the user
    if (error.response?.status === 401) {
        console.log('🚪 Refresh failed, logging out...');
        logout();
    }
    
    return null;
    }
}, []);

useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (storedToken && userData) {
    // Check if token is still valid
    if (isTokenExpired(storedToken)) {
        console.log('⚠️ Stored token is expired, logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    } else {
        setToken(storedToken);
        setUser(JSON.parse(userData));
    }
    }

    setLoading(false);
}, []);

// ✅ FIXED: Set up automatic token refresh interval
useEffect(() => {
    if (!token) return;

    // Check token every minute
    const interval = setInterval(() => {
    const currentToken = localStorage.getItem('token');
    
    if (currentToken && isTokenExpired(currentToken)) {
        console.log('⚠️ Token about to expire, refreshing...');
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

return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshToken }}>
    {children}
    </AuthContext.Provider>
);
}

export function useAuth() {
return useContext(AuthContext);
}