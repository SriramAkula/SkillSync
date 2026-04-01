import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage) },
  { path: 'edit', loadComponent: () => import('./pages/edit-profile/edit-profile.page').then(m => m.EditProfilePage) }
];
