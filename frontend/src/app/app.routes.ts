import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { 
    path: '', 
    pathMatch: 'full',
    loadComponent: () => import('./features/public/pages/home/home.page').then(m => m.HomePage) 
  },

  // ── Public ─────────────────────────────────────────────────────────────────
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component')
      .then(m => m.UnauthorizedComponent)
  },

  // ── Shell (navbar + sidebar) ───────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'mentors',
        loadChildren: () => import('./features/mentors/mentors.routes').then(m => m.MENTOR_ROUTES)
      },
      {
        path: 'sessions',
        loadChildren: () => import('./features/sessions/sessions.routes').then(m => m.SESSION_ROUTES)
      },
      {
        path: 'skills',
        loadChildren: () => import('./features/skills/skills.routes').then(m => m.SKILL_ROUTES)
      },
      {
        path: 'groups',
        loadChildren: () => import('./features/groups/groups.routes').then(m => m.GROUP_ROUTES)
      },
      {
        path: 'reviews',
        loadChildren: () => import('./features/reviews/reviews.routes').then(m => m.REVIEW_ROUTES)
      },
      {
        path: 'notifications',
        loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.NOTIFICATION_ROUTES)
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
      },
      {
        path: 'payment',
        loadChildren: () => import('./features/payment/payment.routes').then(m => m.PAYMENT_ROUTES)
      },

      // ── Mentor-only ──────────────────────────────────────────────────────
      {
        path: 'mentor-dashboard',
        canActivate: [roleGuard('ROLE_MENTOR')],
        loadChildren: () => import('./features/sessions/mentor-sessions.routes').then(m => m.MENTOR_SESSION_ROUTES)
      },

      // ── Admin-only ───────────────────────────────────────────────────────
      {
        path: 'admin',
        canActivate: [roleGuard('ROLE_ADMIN')],
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
      }
    ]
  },

  { path: '**', redirectTo: 'mentors' }
];
