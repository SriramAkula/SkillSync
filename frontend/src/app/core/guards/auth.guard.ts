import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';

export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.isAuthenticated()) return true;

  router.navigate(['/auth/login']);
  return false;
};

export const roleGuard = (requiredRole: string): CanActivateFn => () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (!store.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (store.roles().includes(requiredRole)) return true;

  // For ROLE_MENTOR specifically — likely stale JWT after approval
  // Redirect to a helpful page instead of generic unauthorized
  if (requiredRole === 'ROLE_MENTOR') {
    router.navigate(['/unauthorized'], { queryParams: { reason: 'mentor' } });
  } else {
    router.navigate(['/unauthorized']);
  }
  return false;
};
