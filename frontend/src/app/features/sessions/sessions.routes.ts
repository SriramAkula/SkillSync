import { Routes } from '@angular/router';

export const SESSION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/my-sessions/my-sessions.page').then(m => m.MySessionsPage)
  },
  {
    path: 'request',
    loadComponent: () => import('./pages/request-session/request-session.page').then(m => m.RequestSessionPage)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/session-detail/session-detail.page').then(m => m.SessionDetailPage)
  }
];

export const MENTOR_SESSION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/mentor-sessions/mentor-sessions.page').then(m => m.MentorSessionsPage)
  }
];
