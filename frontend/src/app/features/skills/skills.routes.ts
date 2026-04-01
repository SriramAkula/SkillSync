import { Routes } from '@angular/router';

export const SKILL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/skill-list/skill-list.page').then(m => m.SkillListPage)
  }
];
