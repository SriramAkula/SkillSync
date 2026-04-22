import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import type { MentorProfile, MentorSearchParams } from '../types/mentor';

interface MentorState {
  approvedMentors: MentorProfile[];
  searchResults: MentorProfile[];
  myProfile: MentorProfile | null;
  loading: boolean;
  error: string | null;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  selectedMentor: MentorProfile | null;

  loadApproved: (params: { page: number; size: number }) => Promise<void>;
  search: (params: MentorSearchParams) => Promise<void>;
  loadById: (id: number) => Promise<void>;
  loadMyProfile: () => Promise<void>;
  applyAsMentor: (data: { specialization: string; yearsOfExperience: number; hourlyRate: number; bio: string }) => Promise<void>;
  updateAvailability: (status: 'AVAILABLE' | 'BUSY') => Promise<void>;
  clearSelected: () => void;
}

export const useMentorStore = create<MentorState>((set) => ({
  approvedMentors: [],
  searchResults: [],
  myProfile: null,
  loading: false,
  error: null,
  totalElements: 0,
  currentPage: 0,
  pageSize: 10,
  selectedMentor: null,

  loadApproved: async ({ page, size }) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/mentor/approved', {
        params: { page, size }
      });
      const data = response.data.data;
      set({ 
        approvedMentors: data.content || [], 
        totalElements: data.totalElements || 0,
        currentPage: page,
        loading: false 
      });
    } catch (err) {
      set({ error: 'Failed to load mentors', loading: false });
    }
  },

  search: async (params) => {
    set({ loading: true, error: null });
    try {
      // Angular sends search query to backend usually
      // However here we might need to hit a search endpoint
      // Assuming GET /mentor/search based on standard Spring data rest structure or custom
      const response = await apiClient.get('/mentor/search', { params });
      const data = response.data.data;
      set({ 
        searchResults: data.content || [],
        totalElements: data.totalElements || 0,
        currentPage: params.page || 0,
        loading: false 
      });
    } catch (err) {
      set({ error: 'Search failed', loading: false });
    }
  },

  loadById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/mentor/${id}`);
      const data = response.data.data || response.data;
      set({ selectedMentor: data, loading: false });
    } catch (err) {
      set({ error: 'Failed to load mentor profile', loading: false });
    }
  },

  loadMyProfile: async () => {
    try {
      const response = await apiClient.get('/mentor/profile/me');
      const data = response.data.data || response.data;
      set({ myProfile: data });
    } catch (err) {
      console.warn("User is not a mentor or failed to load profile");
    }
  },

  applyAsMentor: async (data: { specialization: string; yearsOfExperience: number; hourlyRate: number; bio: string }) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/mentor/apply', data);
      const resData = response.data.data || response.data;
      set({ myProfile: resData, loading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to apply as mentor';
      set({ error: msg, loading: false });
    }
  },

  updateAvailability: async (status: 'AVAILABLE' | 'BUSY') => {
    try {
      await apiClient.put('/mentor/profile/me/availability', null, { params: { status } });
      set(state => ({
        myProfile: state.myProfile ? { ...state.myProfile, availabilityStatus: status } : null
      }));
    } catch (err) {
      console.error("Failed to update availability");
    }
  },

  clearSelected: () => set({ selectedMentor: null })
}));
