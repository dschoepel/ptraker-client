import api from './api';
import { createClient } from '@supabase/supabase-js';

// Direct Supabase client for auth operations that need to bypass Express
// Used for password reset so the verification link uses the correct origin
export const supabaseAuth = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

// =============================================================================
// Auth Service
// =============================================================================

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (updates) => {
    const response = await api.patch('/auth/profile', updates);
    return response.data;
  },

  uploadAvatar: async (file) => {
    const form = new FormData();
    form.append('avatar', file);
    const response = await api.post('/auth/profile/avatar', form, {
      headers: { 'Content-Type': undefined },
    });
    return response.data;
  },

  removeAvatar: async () => {
    const response = await api.delete('/auth/profile/avatar');
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
};