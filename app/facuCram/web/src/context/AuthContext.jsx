import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }){
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const saved = localStorage.getItem('auth');
    if (saved) {
      try {
        const { token, user } = JSON.parse(saved);
        setToken(token); setUser(user);
      } catch {}
    }
    setLoading(false);
  },[]);

  useEffect(()=>{
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const saveSession = (token, user) => {
    setToken(token); setUser(user);
    localStorage.setItem('auth', JSON.stringify({ token, user }));
  };

  const clearSession = ()=>{
    setToken(null); setUser(null); localStorage.removeItem('auth');
  };

  const login = async (loginField, password) => {
    const r = await api.post('/auth/login', { id: loginField, password });
    if (r.data?.mustCreatePassword) {
      sessionStorage.setItem('tempToken', r.data.token);
      return { mustCreatePassword: true, user: r.data.user };
    }
    saveSession(r.data.token, r.data.user);
    return { ok: true };
  };

  const setPassword = async (password, password_confirmation) => {
    const temp = sessionStorage.getItem('tempToken');
    if (!temp) throw new Error('Sesión temporal expirada');
    const res = await api.post('/auth/set-password', { password, password_confirmation }, {
      headers: { Authorization: `Bearer ${temp}` }
    });
    sessionStorage.removeItem('tempToken');
    saveSession(res.data.token, res.data.user);
    return { ok: true };
  };

  const logout = ()=> clearSession();

  const value = useMemo(()=>({ user, token, loading, login, setPassword, logout }), [user, token, loading]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(){ return useContext(AuthCtx); }
