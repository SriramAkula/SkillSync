import { Routes } from '@angular/router';
export const NOTIFICATION_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/notification-list/notification-list.page').then(m => m.NotificationListPage) }
];
