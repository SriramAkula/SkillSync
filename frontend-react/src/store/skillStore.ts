import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import type { Skill, SkillCategoryGroup } from '../types/skill';

interface SkillState {
  skills: Skill[];
  loading: boolean;
  error: string | null;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;

  loadAll: (params?: { page: number; size: number }) => Promise<void>;
  search: (params: { keyword: string; page: number; size: number }) => Promise<void>;
  addSkill: (skill: Skill) => void;
  updateSkill: (skill: Skill) => void;
  removeSkill: (id: number) => void;
  loadForSelection: () => Promise<void>;
  groupedByCategory: () => SkillCategoryGroup[];
}

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: [],
  loading: false,
  error: null,
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  pageSize: 12,

  loadAll: async (params) => {
    set({ loading: true, error: null });
    try {
      const page = params?.page ?? 0;
      const size = params?.size ?? 12;
      const response = await apiClient.get('/skill', { params: { page, size } });
      const data = response.data.data || response.data;
      set({ 
        skills: data.content || [], 
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 0,
        currentPage: data.currentPage || 0,
        loading: false 
      });
    } catch (err) {
      set({ error: 'Failed to load skills', loading: false });
    }
  },

  search: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/skill/search', { params });
      const data = response.data.data || response.data;
      set({ 
        skills: data.content,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        loading: false 
      });
    } catch (err) {
      set({ error: 'Search failed', loading: false });
    }
  },

  addSkill: (skill) => set((state) => ({ skills: [skill, ...state.skills], totalElements: state.totalElements + 1 })),
  
  updateSkill: (skill) => set((state) => ({
    skills: state.skills.map(s => s.id === skill.id ? skill : s)
  })),

  removeSkill: (id) => set((state) => ({
    skills: state.skills.filter(s => s.id !== id),
    totalElements: Math.max(0, state.totalElements - 1)
  })),

  loadForSelection: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/skill?page=0&size=100&sort=popularityScore,desc');
      const data = response.data.data || response.data;
      set({ skills: data.content, loading: false });
    } catch (err) {
      set({ error: 'Failed to load skills', loading: false });
    }
  },

  groupedByCategory: () => {
    const { skills } = get();
    const categoriesMap = new Map<string, Skill[]>();
    
    skills.forEach(skill => {
      const cat = skill.category || 'Other';
      if (!categoriesMap.has(cat)) {
        categoriesMap.set(cat, []);
      }
      categoriesMap.get(cat)!.push(skill);
    });

    return Array.from(categoriesMap.entries()).map(([category, skills]) => ({
      category,
      skills
    }));
  }
}));
