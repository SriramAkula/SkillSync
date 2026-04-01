import { Routes } from '@angular/router';
export const ADMIN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/pending-mentors/pending-mentors.page').then(m => m.PendingMentorsPage) }
];
