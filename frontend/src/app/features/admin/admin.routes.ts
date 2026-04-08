import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/pending-mentors/pending-mentors.page').then(m => m.PendingMentorsPage) },
  { path: 'users', loadComponent: () => import('./pages/users/admin-users.page').then(m => m.AdminUsersPage) },
  { path: 'users/:id/block', loadComponent: () => import('./pages/users/block-user.page').then(m => m.BlockUserPage) },
  { path: 'users/:id/unblock', loadComponent: () => import('./pages/users/unblock-user.page').then(m => m.UnblockUserPage) },
  { path: 'users/:id', loadComponent: () => import('./pages/user-detail/user-detail.component').then(m => m.UserDetailComponent) },
  { path: 'skills', loadComponent: () => import('../skills/pages/skill-list/skill-list.page').then(m => m.SkillListPage) }
];
