import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import type { Group, CreateGroupRequest, GroupPageResponse } from '../types/group';

interface GroupState {
  groups: Group[];
  selectedGroup: Group | null;
  loading: boolean;
  error: string | null;
  
  // Pagination
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;

  loadRandomGroups: (limit?: number) => Promise<void>;
  loadGroupsBySkill: (skillId: number, page?: number, size?: number) => Promise<void>;
  loadGroupDetails: (id: number) => Promise<void>;
  createGroup: (req: CreateGroupRequest) => Promise<Group>;
  joinGroup: (id: number) => Promise<void>;
  leaveGroup: (id: number) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  selectedGroup: null,
  loading: false,
  error: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  pageSize: 12,

  loadRandomGroups: async (limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/group/random?limit=${limit}`);
      set({ groups: response.data.data || response.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to load featured groups', loading: false });
    }
  },

  loadGroupsBySkill: async (skillId, page = 0, size = 12) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/group/skill/${skillId}`, {
        params: { page, size }
      });
      const data: GroupPageResponse = response.data.data || response.data;
      set({ 
        groups: data.content,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        loading: false 
      });
    } catch (err) {
      set({ error: 'Failed to find groups for this skill', loading: false });
    }
  },

  loadGroupDetails: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/group/${id}`);
      set({ selectedGroup: response.data.data || response.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to load group details', loading: false });
    }
  },

  createGroup: async (req) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/group', req);
      const newGroup = response.data.data || response.data;
      set((state) => ({ 
        groups: [newGroup, ...state.groups], 
        loading: false 
      }));
      return newGroup;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  joinGroup: async (id) => {
    try {
      const response = await apiClient.post(`/group/${id}/join`, null);
      const updated = response.data.data || response.data;
      set((state) => ({
        selectedGroup: state.selectedGroup?.id === id ? updated : state.selectedGroup,
        groups: state.groups.map(g => g.id === id ? updated : g)
      }));
    } catch (err) {
      throw err;
    }
  },

  leaveGroup: async (id) => {
    try {
      const response = await apiClient.delete(`/group/${id}/leave`);
      const updated = response.data.data || response.data;
      set((state) => ({
        selectedGroup: state.selectedGroup?.id === id ? updated : state.selectedGroup,
        groups: state.groups.map(g => g.id === id ? updated : g)
      }));
    } catch (err) {
      throw err;
    }
  },

  deleteGroup: async (id) => {
    try {
      await apiClient.delete(`/group/${id}`);
      set((state) => ({
        selectedGroup: state.selectedGroup?.id === id ? null : state.selectedGroup,
        groups: state.groups.filter(g => g.id !== id)
      }));
    } catch (err) {
      throw err;
    }
  }
}));
