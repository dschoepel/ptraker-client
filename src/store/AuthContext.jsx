import { useState, useCallback } from 'react';
import { AuthContext } from './context';
import { authService } from '../services/auth.service';

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
