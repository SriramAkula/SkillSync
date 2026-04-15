import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');

  // Verify token exists for protected endpoints
  if (!token && isProtectedEndpoint(req.url)) {
    console.warn('JWT Interceptor: No token found for protected endpoint', req.url);
  }

  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Log all errors for debugging
      console.error(`HTTP Error ${err.status}:`, err.message, 'URL:', req.url);
      
      if (err.status === 401) {
        if (req.url.includes('/auth/')) {
          console.warn('Auth endpoint returned 401, not attempting refresh');
          return throwError(() => err);
        }
        console.warn('Token expired, attempting refresh...');
        return handle401(req, next, authService, router);
      }
      if (err.status === 403) {
        console.warn('Access forbidden for:', req.url);
        return throwError(() => err);
      }
      // Pass through all other errors (400, 404, 500, etc.)
      console.error('HTTP request failed:', err.status, err.statusText);
      return throwError(() => err);
    })
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  console.debug('Adding JWT token to request:', req.url.substring(req.url.lastIndexOf('/') + 1));
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isProtectedEndpoint(url: string): boolean {
  const publicPaths = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/oauth'];
  return !publicPaths.some(path => url.includes(path));
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
) {
  if (isRefreshing) {
    return refreshSubject.pipe(
      filter(t => t !== null),
      take(1),
      switchMap(token => next(addToken(req, token!)))
    );
  }

  isRefreshing = true;
  refreshSubject.next(null);

  return authService.refreshToken().pipe(
    switchMap(res => {
      isRefreshing = false;
      console.log('Token refreshed successfully');
      localStorage.setItem('token', res.token);
      // refreshToken is automatically handled by HttpOnly cookie
      refreshSubject.next(res.token);
      return next(addToken(req, res.token));
    }),
    catchError(err => {
      isRefreshing = false;
      console.error('Token refresh failed, redirecting to login');
      localStorage.clear();
      router.navigate(['/auth/login']);
      return throwError(() => err);
    })
  );
}
