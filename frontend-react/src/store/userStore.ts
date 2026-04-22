import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import type { UserProfile } from '../types/auth';

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  activities: any[];

  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  loadActivities: () => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  loading: false,
  error: null,
  activities: [],

  loadProfile: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/users/me/profile');
      set({ profile: response.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load profile', loading: false });
    }
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put('/users/me/profile', data);
      set({ profile: response.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to update profile', loading: false });
      throw err;
    }
  },

  checkUsernameAvailability: async (username) => {
    try {
      const response = await apiClient.get('/users/check-username', { params: { username } });
      return response.data.data; // true if available
    } catch {
      return false;
    }
  },

  loadActivities: async () => {
    try {
      const response = await apiClient.get('/notifications');
      set({ activities: response.data.data?.content || [] });
    } catch {
      // Slient fail for activities
    }
  },

  clearError: () => set({ error: null }),
}));
