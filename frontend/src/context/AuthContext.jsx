import React, { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('crewsync_token');
    if (!token) { setLoading(false); return; }
    client.get('/auth/me').then((res) => setUser(res.data.user)).catch(() => localStorage.removeItem('crewsync_token')).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    localStorage.setItem('crewsync_token', res.data.token);
    setUser(res.data.user);
  };

  const register = async (payload) => {
    const res = await client.post('/auth/register', payload);
    localStorage.setItem('crewsync_token', res.data.token);
    setUser(res.data.user);
  };

  const logout = () => { localStorage.removeItem('crewsync_token'); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
