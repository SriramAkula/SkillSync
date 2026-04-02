import { Routes } from '@angular/router';
export const ADMIN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/pending-mentors/pending-mentors.page').then(m => m.PendingMentorsPage) },
  { path: 'skills', loadComponent: () => import('./pages/skills-management/skills-management.page').then(m => m.SkillsManagementPage) }
];
