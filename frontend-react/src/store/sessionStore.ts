import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import type { Session, SessionSearchParams } from '../types/session';

interface SessionState {
  learnerSessions: Session[];
  mentorSessions: Session[];
  loading: boolean;
  error: string | null;
  learnerTotalElements: number;
  learnerCurrentPage: number;
  learnerPageSize: number;
  mentorTotalElements: number;
  mentorCurrentPage: number;
  mentorPageSize: number;
  selectedSession: Session | null;

  loadLearnerSessions: (params: SessionSearchParams) => Promise<void>;
  loadMentorSessions: (params: SessionSearchParams) => Promise<void>;
  loadById: (id: number) => Promise<void>;
  requestSession: (payload: { mentorId: number; skillId: number; scheduledAt: string; durationMinutes: number }) => Promise<void>;
  accept: (id: number) => Promise<void>;
  reject: (data: { id: number; reason: string }) => Promise<void>;
  cancel: (sessionId: number) => Promise<void>;
  clearSelected: () => void;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  learnerSessions: [],
  mentorSessions: [],
  loading: false,
  error: null,
  learnerTotalElements: 0,
  learnerCurrentPage: 0,
  learnerPageSize: 12,
  mentorTotalElements: 0,
  mentorCurrentPage: 0,
  mentorPageSize: 8,
  selectedSession: null,

  loadLearnerSessions: async ({ page = 0, size = 12 }) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/session/learner/list', { params: { page, size } });
      const responseData = response.data.data || response.data;
      set({ 
        learnerSessions: responseData.content || [], 
        learnerTotalElements: responseData.totalElements || 0,
        learnerCurrentPage: page,
        loading: false 
      });
    } catch (err) {
      set({ error: 'Failed to load sessions', loading: false });
    }
  },

  loadMentorSessions: async ({ page = 0, size = 8 }) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/session/mentor/list', { params: { page, size } });
      const responseData = response.data.data || response.data;
      set({ 
        mentorSessions: responseData.content || [], 
        mentorTotalElements: responseData.totalElements || 0,
        mentorCurrentPage: page,
        loading: false 
      });
    } catch (err) {
      set({ error: 'Failed to load mentor sessions', loading: false });
    }
  },

  loadById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/session/${id}`);
      set({ selectedSession: response.data.data || response.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to load session details', loading: false });
    }
  },

  requestSession: async (payload) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/session/request', payload);
      set({ loading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to request session';
      set({ error: msg, loading: false });
    }
  },

  accept: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put(`/session/${id}/accept`);
      set({ selectedSession: response.data.data || response.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to accept session', loading: false });
    }
  },

  reject: async ({ id, reason }) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put(`/session/${id}/reject`, null, { params: { reason } });
      set({ selectedSession: response.data.data || response.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to reject session', loading: false });
    }
  },

  cancel: async (sessionId: number) => {
    set({ loading: true, error: null });
    try {
      await apiClient.put(`/session/${sessionId}/cancel`);
      // Optimistic update
      set(state => ({
        learnerSessions: state.learnerSessions.map(s => 
          s.id === sessionId ? { ...s, status: 'CANCELLED' as const } : s
        ),
        selectedSession: state.selectedSession?.id === sessionId ? { ...state.selectedSession, status: 'CANCELLED' } : state.selectedSession,
        loading: false
      }));
    } catch (err) {
      set({ error: 'Failed to cancel session', loading: false });
    }
  },

  clearSelected: () => set({ selectedSession: null }),
  clearError: () => set({ error: null })
}));
