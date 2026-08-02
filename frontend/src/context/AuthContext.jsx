import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL as API } from '../config';
import { clearAuth, persistAuth, readStoredAuth, verifyAuthToken } from './authContextUtils';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  // Restore session on load
  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      const { savedToken, savedUser } = stored;
      const parsedUser = JSON.parse(savedUser);
      queueMicrotask(() => {
        setToken(savedToken);
        setUser(parsedUser);
      });
      verifyAuthToken(savedToken)
        .catch(() => {
          clearAuth();
          queueMicrotask(() => {
            setToken(null);
            setUser(null);
          });
        });
    }
    queueMicrotask(() => setReady(true));
  }, []);

  const persist = (newToken, newUser) => {
    persistAuth(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const signup = async ({ username, email, password, college }) => {
    const r = await axios.post(`${API}/api/auth/signup`, { username, email, password, college });
    if (r.data.success) persist(r.data.token, r.data.user);
    return r.data;
  };

  const login = async ({ username, password }) => {
    const r = await axios.post(`${API}/api/auth/login`, { username, password });
    if (r.data.success) persist(r.data.token, r.data.user);
    return r.data;
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    persistAuth(token, updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, ready, signup, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
