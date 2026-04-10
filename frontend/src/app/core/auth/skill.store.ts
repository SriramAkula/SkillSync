import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { SkillService } from '../services/skill.service';
import { SkillDto, CreateSkillRequest } from '../../shared/models/skill.models';

interface SkillState {
  skills: SkillDto[];
  loading: boolean;
  error: string | null;
  
  // Pagination State
  currentPage: number;
  totalElements: number;
  totalPages: number;
  pageSize: number;
}

export const SkillStore = signalStore(
  { providedIn: 'root' },
  withState<SkillState>({ 
    skills: [], 
    loading: false, 
    error: null,
    currentPage: 0,
    totalElements: 0,
    totalPages: 0,
    pageSize: 12
  }),

  withMethods((store, svc = inject(SkillService)) => ({

    loadAll: rxMethod<{ page?: number; size?: number } | void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((params) => {
          const p = (params as any)?.page ?? 0;
          const s = (params as any)?.size ?? 12;
          return svc.getAll(p, s).pipe(
            tapResponse({
              next: (res) => patchState(store, { 
                skills: res.data.content ?? [], 
                currentPage: res.data.currentPage,
                totalElements: res.data.totalElements,
                totalPages: res.data.totalPages,
                pageSize: res.data.pageSize,
                loading: false 
              }),
              error: (e: any) => patchState(store, { loading: false, error: e.error?.message ?? 'Failed to load skills' })
            })
          );
        })
      )
    ),

    search: rxMethod<{ keyword: string; page?: number; size?: number }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((params) => {
          const p = params.page ?? 0;
          const s = params.size ?? 12;
          return svc.search(params.keyword, p, s).pipe(
            tapResponse({
              next: (res) => patchState(store, { 
                skills: res.data.content ?? [], 
                currentPage: res.data.currentPage,
                totalElements: res.data.totalElements,
                totalPages: res.data.totalPages,
                pageSize: res.data.pageSize,
                loading: false 
              }),
              error: (e: any) => patchState(store, { loading: false, error: e.error?.message ?? 'Search failed' })
            })
          );
        })
    ),

    loadForSelection: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          svc.getAll(0, 500).pipe(
            tapResponse({
              next: (res) => patchState(store, { 
                skills: res.data.content ?? [], 
                loading: false 
              }),
              error: () => patchState(store, { loading: false })
            })
          )
        )
      )
    ),

    addSkill(skill: SkillDto): void {
      patchState(store, { skills: [skill, ...store.skills()] });
    },

    updateSkill(skill: SkillDto): void {
      patchState(store, { skills: store.skills().map(s => s.id === skill.id ? skill : s) });
    },

    removeSkill(id: number): void {
      patchState(store, { skills: store.skills().filter(s => s.id !== id) });
    },

    // Returns skills grouped by category for selection UI
    groupedByCategory(): { category: string; skills: { id: number; name: string }[] }[] {
      const map = new Map<string, { id: number; name: string }[]>();
      for (const s of store.skills()) {
        const cat = s.category?.trim() || 'Other';
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push({ id: s.id, name: s.skillName });
      }
      return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([category, skills]) => ({ 
          category, 
          skills: skills.sort((a, b) => a.name.localeCompare(b.name)) 
        }));
    },

    // Returns flat list of skill names for search/display
    skillNames(): string[] {
      return store.skills().map(s => s.skillName).sort();
    },

    getSkillById(id: number): SkillDto | undefined {
      return store.skills().find(s => s.id === id);
    }
  }))
);
