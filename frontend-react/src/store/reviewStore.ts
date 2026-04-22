import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import type { Review, SubmitReviewRequest, MentorRating } from '../types/review';

interface ReviewState {
  reviews: Review[];
  rating: MentorRating | null;
  loading: boolean;
  submitting: boolean;
  currentPage: number;
  totalElements: number;
  totalPages: number;

  loadMentorReviews: (mentorId: number, page?: number, size?: number) => Promise<void>;
  loadMentorRating: (mentorId: number) => Promise<void>;
  submitReview: (req: SubmitReviewRequest) => Promise<Review>;
  updateReview: (id: number, req: SubmitReviewRequest) => Promise<Review>;
  deleteReview: (id: number) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  rating: null,
  loading: false,
  submitting: false,
  currentPage: 0,
  totalElements: 0,
  totalPages: 0,

  loadMentorReviews: async (mentorId, page = 0, size = 10) => {
    set({ loading: true });
    try {
      const response = await apiClient.get(`/review/mentors/${mentorId}`, {
        params: { page, size }
      });
      const data = response.data.data;
      set((state) => ({
        reviews: page === 0 ? data.content : [...state.reviews, ...data.content],
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        loading: false
      }));
    } catch (error) {
      set({ loading: false });
      console.error('Failed to load mentor reviews', error);
    }
  },

  loadMentorRating: async (mentorId) => {
    try {
      const response = await apiClient.get(`/review/mentors/${mentorId}/rating`);
      set({ rating: response.data.data });
    } catch (error) {
      console.error('Failed to load mentor rating', error);
    }
  },

  submitReview: async (req) => {
    set({ submitting: true });
    try {
      const response = await apiClient.post('/review', req);
      const newReview = response.data.data;
      set((state) => ({
        reviews: [newReview, ...state.reviews],
        submitting: false
      }));
      // Refresh rating summary
      get().loadMentorRating(req.mentorId);
      return newReview;
    } catch (error) {
      set({ submitting: false });
      throw error;
    }
  },

  updateReview: async (id, req) => {
    try {
      const response = await apiClient.put(`/review/${id}`, req);
      const updated = response.data.data;
      set((state) => ({
        reviews: state.reviews.map(r => r.id === id ? updated : r)
      }));
      return updated;
    } catch (error) {
      throw error;
    }
  },

  deleteReview: async (id) => {
    try {
      await apiClient.delete(`/review/${id}`);
      set((state) => ({
        reviews: state.reviews.filter(r => r.id !== id),
        totalElements: state.totalElements - 1
      }));
    } catch (error) {
      throw error;
    }
  }
}));
