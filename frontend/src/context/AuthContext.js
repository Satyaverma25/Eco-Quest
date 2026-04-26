import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('ecoquest_token'));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const _saveSession = (tkn, usr) => {
    localStorage.setItem('ecoquest_token', tkn);
    api.defaults.headers.common['Authorization'] = `Bearer ${tkn}`;
    setToken(tkn);
    setUser(usr);
  };

  // Student registration — no OTP, returns success message only (no auto-login)
  const register = async (username, email, password, avatar, studentType, institution = '') => {
    const { data } = await api.post('/auth/register', { username, email, password, avatar, studentType, institution });
    return data; // { success, message } — caller handles redirect
  };

  // Student login
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    _saveSession(data.token, data.user);
    return data;
  };

  // Teacher registration — no OTP, returns success message only
  const registerTeacher = async (name, email, password, institution = '') => {
    const { data } = await api.post('/auth/register-teacher', { name, email, password, institution });
    return data; // { success, message } — caller handles redirect
  };

  // Teacher login — direct, no OTP
  const teacherLogin = async (email, password) => {
    const { data } = await api.post('/auth/teacher-login', { email, password });
    _saveSession(data.token, data.user);
    return data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('ecoquest_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      register, login,
      registerTeacher, teacherLogin,
      logout, updateUser, refreshUser,
      isAdmin: user?.role === 'admin',
      isTeacher: user?.role === 'teacher' || user?.role === 'admin',
      isStudent: user?.role === 'student',
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
