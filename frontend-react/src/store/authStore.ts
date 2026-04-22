import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../types/auth';

interface AuthState {
  token: string | null;
  roles: string[];
  userId: number | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  otpVerified: boolean;

  setAuth: (token: string, roles: string[]) => void;
  setUser: (user: UserProfile) => void;
  addRole: (role: string) => void;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  sendForgotPasswordOtp: (email: string) => Promise<void>;
  resetPassword: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

import { apiClient } from '../api/apiClient';

// Helper to decode JWT roles/userId
const decodeJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      roles: [],
      userId: null,
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      otpSent: false,
      otpVerified: false,

      setAuth: (token, roles) => {
        const claims = decodeJwt(token);
        set({ 
          token, 
          roles: roles.length > 0 ? roles : (claims.roles || []), 
          userId: claims.userId || (claims.sub ? Number(claims.sub) : null),
          isAuthenticated: !!token 
        });
      },

      setUser: (user) => set({ user }),
      
      addRole: (role) => set((state) => ({ roles: [...new Set([...state.roles, role])] })),

      sendOtp: async (email) => {
        set({ loading: true, error: null });
        try {
          await apiClient.post('/auth/send-otp', null, { params: { email } });
          set({ loading: false, otpSent: true });
        } catch (err: any) {
          set({ error: err.response?.data?.message || 'Failed to send OTP', loading: false });
        }
      },

      verifyOtp: async (email, otp) => {
        set({ loading: true, error: null });
        try {
          await apiClient.post('/auth/verify-otp', null, { params: { email, otp } });
          set({ loading: false, otpVerified: true });
        } catch (err: any) {
          set({ error: err.response?.data?.message || 'Invalid OTP', loading: false });
        }
      },

      sendForgotPasswordOtp: async (email) => {
        set({ loading: true, error: null });
        try {
          await apiClient.post('/auth/forgot-password/send-otp', null, { params: { email } });
          set({ loading: false });
        } catch (err: any) {
          set({ error: err.response?.data?.message || 'Failed to send reset code', loading: false });
          throw err;
        }
      },

      resetPassword: async (email, password) => {
        set({ loading: true, error: null });
        try {
          await apiClient.post('/auth/forgot-password/reset', { email, password });
          set({ loading: false });
        } catch (err: any) {
          set({ error: err.response?.data?.message || 'Failed to reset password', loading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.post('/auth/register', data);
          const { token, roles } = response.data;
          const claims = decodeJwt(token);
          set({ 
            token, 
            roles: roles || claims.roles || [], 
            userId: claims.userId || (claims.sub ? Number(claims.sub) : null),
            isAuthenticated: true,
            loading: false 
          });
        } catch (err: any) {
          set({ error: err.response?.data?.message || 'Registration failed', loading: false });
        }
      },

      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch (err) {
          console.warn("Logout request failed on server");
        }
        set({ token: null, roles: [], userId: null, user: null, isAuthenticated: false, otpSent: false, otpVerified: false });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'skillsync-auth',
    }
  )
);
