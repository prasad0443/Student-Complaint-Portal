import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from '../api/client';

const AuthContext = createContext(null);

const STORAGE_KEY = 'scp_token';
/** 'student' | 'admin' — which /me endpoint to use after refresh */
const REALM_KEY = 'scp_auth_realm';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token || null);
    if (!token) {
      setUser(null);
      setLoading(false);
      localStorage.removeItem(REALM_KEY);
      return;
    }
    let cancelled = false;
    const realm = localStorage.getItem(REALM_KEY) || 'student';
    const mePath = realm === 'admin' ? '/api/admin/me' : '/api/auth/me';
    (async () => {
      try {
        const { data } = await api.get(mePath);
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(REALM_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (identifier, password) => {
    const { data } = await api.post('/api/auth/login', { identifier, password });
    localStorage.setItem(STORAGE_KEY, data.token);
    localStorage.setItem(REALM_KEY, 'student');
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const adminLogin = async (email, password) => {
    const { data } = await api.post('/api/admin/login', { email, password });
    localStorage.setItem(STORAGE_KEY, data.token);
    localStorage.setItem(REALM_KEY, 'admin');
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    localStorage.setItem(STORAGE_KEY, data.token);
    localStorage.setItem(REALM_KEY, 'student');
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REALM_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      adminLogin,
      register,
      logout,
      isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
      isSuperAdmin: user?.role === 'super_admin',
      isStudent: user?.role === 'student',
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
