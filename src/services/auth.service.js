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

  forgotPassword: async (email) => {
    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return { success: true };
  },
};