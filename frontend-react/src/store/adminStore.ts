import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import type { AdminUserProfile, AdminStats, PagedResponse } from '../types/admin';
import type { MentorProfile } from '../types/mentor';

interface AdminState {
  users: AdminUserProfile[];
  pendingMentors: MentorProfile[];
  stats: AdminStats | null;
  selectedUser: AdminUserProfile | null;
  loading: boolean;
  
  // Pagination
  usersPage: number;
  usersTotal: number;
  pendingPage: number;
  pendingTotal: number;

  loadUsers: (page?: number, size?: number) => Promise<void>;
  loadBlockedUsers: () => Promise<void>;
  loadUserDetails: (userId: number) => Promise<void>;
  blockUser: (userId: number, reason: string) => Promise<void>;
  unblockUser: (userId: number) => Promise<void>;
  loadPendingMentors: (page?: number, size?: number) => Promise<void>;
  approveMentor: (id: number) => Promise<void>;
  rejectMentor: (id: number) => Promise<void>;
  loadStats: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  users: [],
  pendingMentors: [],
  stats: null,
  selectedUser: null,
  loading: false,
  usersPage: 0,
  usersTotal: 0,
  pendingPage: 0,
  pendingTotal: 0,

  loadUsers: async (page = 0, size = 20) => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/user/admin/all', {
        params: { page, size }
      });
      const data: PagedResponse<AdminUserProfile> = response.data.data;
      set({
        users: data.content,
        usersTotal: data.totalElements,
        usersPage: data.currentPage,
        loading: false
      });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to load users', error);
    }
  },

  loadBlockedUsers: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/user/admin/blocked');
      set({ users: response.data.data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to load blocked users', error);
    }
  },

  loadUserDetails: async (userId) => {
    set({ loading: true });
    try {
      const response = await apiClient.get(`/user/admin/${userId}/details`);
      set({ selectedUser: response.data.data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to load user details', error);
    }
  },

  blockUser: async (userId, reason) => {
    try {
      const response = await apiClient.put(`/user/admin/${userId}/block`, { reason });
      const updated = response.data.data;
      set((state) => ({
        users: state.users.map(u => u.userId === userId ? updated : u),
        selectedUser: state.selectedUser?.userId === userId ? updated : state.selectedUser
      }));
    } catch (error) {
      console.error('Failed to block user', error);
      throw error;
    }
  },

  unblockUser: async (userId) => {
    try {
      const response = await apiClient.put(`/user/admin/${userId}/unblock`);
      const updated = response.data.data;
      set((state) => ({
        users: state.users.map(u => u.userId === userId ? updated : u),
        selectedUser: state.selectedUser?.userId === userId ? updated : state.selectedUser
      }));
    } catch (error) {
      console.error('Failed to unblock user', error);
      throw error;
    }
  },

  loadPendingMentors: async (page = 0, size = 12) => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/mentor/pending', {
        params: { page, size }
      });
      const data = response.data.data;
      set({
        pendingMentors: data.content,
        pendingTotal: data.totalElements,
        pendingPage: data.currentPage,
        loading: false
      });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to load pending mentors', error);
    }
  },

  approveMentor: async (id) => {
    try {
      await apiClient.put(`/mentor/${id}/approve`);
      set((state) => ({
        pendingMentors: state.pendingMentors.filter(m => m.id !== id),
        pendingTotal: state.pendingTotal - 1
      }));
    } catch (error) {
      console.error('Failed to approve mentor', error);
    }
  },

  rejectMentor: async (id) => {
    try {
      await apiClient.put(`/mentor/${id}/reject`);
      set((state) => ({
        pendingMentors: state.pendingMentors.filter(m => m.id !== id),
        pendingTotal: state.pendingTotal - 1
      }));
    } catch (error) {
      console.error('Failed to reject mentor', error);
    }
  },

  loadStats: async () => {
    try {
      // Assuming a stats endpoint exists based on usual admin dashboard requirements
      // If not, we can aggregate from other loads or just skip for now.
      const response = await apiClient.get('/admin/stats');
      set({ stats: response.data.data });
    } catch (error) {
      console.error('Failed to load admin stats', error);
    }
  }
}));
