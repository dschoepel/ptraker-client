import { useState, useCallback, useEffect } from 'react';
import { AuthContext } from './context';
import { authService, supabaseAuth } from '../services/auth.service';


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ptraker_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('ptraker_token') || null;
  });

  const isLoading = false;

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    setToken(data.session.accessToken);
    localStorage.setItem('ptraker_token', data.session.accessToken);
    localStorage.setItem('ptraker_user', JSON.stringify(data.user));
    localStorage.setItem('ptraker_refresh_token', data.session.refreshToken);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout(token);
    } catch {
      // Ignore errors — clear local state regardless
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('ptraker_token');
      localStorage.removeItem('ptraker_user');
      localStorage.removeItem('ptraker_refresh_token');
    }
  }, [token]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('ptraker_user', JSON.stringify(updatedUser));
  }, []);

  // Detect Supabase auth redirect (invite acceptance, password recovery)
// These arrive as URL hash fragments: #access_token=xxx&type=invite
useEffect(() => {
  const hash = window.location.hash;
  if (!hash) return;

  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const type = params.get('type');

  if (accessToken && type === 'invite') {
    // New user accepting invite — store session and redirect to set password
    localStorage.setItem('ptraker_token', accessToken);
    if (refreshToken) localStorage.setItem('ptraker_refresh_token', refreshToken);
    
    // Get user info
    supabaseAuth.auth.getUser(accessToken).then(({ data }) => {
      if (data?.user) {
        localStorage.setItem('ptraker_user', JSON.stringify(data.user));
        setToken(accessToken);
        setUser(data.user);
      }
    });
    
    // Clear hash and redirect to set password page
    window.history.replaceState(null, '', '/set-password');
    window.location.href = '/set-password';
  }
}, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!token && !!user,
      login,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
