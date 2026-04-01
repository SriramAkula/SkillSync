import { Routes } from '@angular/router';

export const MENTOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/mentor-list/mentor-list.page').then(m => m.MentorListPage)
  },
  {
    path: 'apply',
    loadComponent: () => import('./pages/apply-mentor/apply-mentor.page').then(m => m.ApplyMentorPage)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/mentor-detail/mentor-detail.page').then(m => m.MentorDetailPage)
  }
];
