import { Routes } from '@angular/router';
export const GROUP_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/group-list/group-list.page').then(m => m.GroupListPage) },
  { path: ':id', loadComponent: () => import('./pages/group-detail/group-detail.page').then(m => m.GroupDetailPage) }
];
