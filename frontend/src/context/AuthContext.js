import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
const [token, setToken] = useState(null); // ✅ ADD TOKEN STATE

useEffect(() => {
const storedToken = localStorage.getItem('token');
const userData = localStorage.getItem('user');

if (storedToken && userData) {
    setToken(storedToken);
    setUser(JSON.parse(userData));
}

setLoading(false);
}, []);

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
<AuthContext.Provider value={{ user, token, login, logout, loading }}>
    {children}
</AuthContext.Provider>
);
}

export function useAuth() {
return useContext(AuthContext);
}