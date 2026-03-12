import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
baseURL: `${API_URL}/api`,
});

api.interceptors.request.use(
(config) => {
// Check both localStorage and sessionStorage
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (token) {
    config.headers.Authorization = `Bearer ${token}`;
}
return config;
},
(error) => {
return Promise.reject(error);
}
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
failedQueue.forEach(prom => {
if (error) {
    prom.reject(error);
} else {
    prom.resolve(token);
}
});
failedQueue = [];
};

api.interceptors.response.use(
(response) => response,
async (error) => {
const originalRequest = error.config;

// If error is 401 and we haven't already tried to refresh
if (error.response?.status === 401 && !originalRequest._retry) {
    
    // Check if it's a token expiration error
    const errorCode = error.response?.data?.error?.code;
    
    if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
    if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
        })
        .then(token => {
        originalRequest.headers['Authorization'] = 'Bearer ' + token;
        return api(originalRequest);
        })
        .catch(err => {
        return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
        // Check both storages for token
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const isRememberMe = !!localStorage.getItem('token');
        
        if (!token) {
        // No token to refresh, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(
        `${API_URL}/api/auth/refresh`,
        {},
        {
            headers: {
            Authorization: `Bearer ${token}`
            }
        }
        );

        const newToken = response.data.token;
        const userData = response.data.user;

        // Update stored token and user data in the correct storage
        if (isRememberMe) {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        } else {
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('user', JSON.stringify(userData));
        }

        // Update the authorization header
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;

        // Process all queued requests with new token
        processQueue(null, newToken);
        isRefreshing = false;

        // Retry the original request with new token
        return api(originalRequest);
        
    } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear auth data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
    }
    }
}

// For other errors or if refresh failed, just reject
return Promise.reject(error);
}
);

export default api;