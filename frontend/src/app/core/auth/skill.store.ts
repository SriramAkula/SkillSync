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
}

export const SkillStore = signalStore(
  { providedIn: 'root' },
  withState<SkillState>({ skills: [], loading: false, error: null }),

  withMethods((store, svc = inject(SkillService)) => ({

    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          svc.getAll().pipe(
            tapResponse({
              next: (r) => patchState(store, { skills: r.data ?? [], loading: false }),
              error: (e: any) => patchState(store, { loading: false, error: e.error?.message ?? 'Failed to load skills' })
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
