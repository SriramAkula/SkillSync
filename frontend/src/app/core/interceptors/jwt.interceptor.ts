import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../store/auth.store';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authStore = inject(AuthStore);
  
  // Standardize URL: Only prepend environment.apiUrl if the request is relative 
  // AND doesn't already start with the API prefix.
  const apiUrl = environment.apiUrl;
  let finalUrl = req.url;
  
  if (!req.url.startsWith('http')) {
    if (apiUrl.startsWith('http')) {
      // Production: environment.apiUrl is absolute (e.g., https://api.skillssync.me/api)
      if (!req.url.startsWith(apiUrl)) {
        if (req.url.startsWith('/api') && apiUrl.endsWith('/api')) {
          finalUrl = apiUrl.slice(0, -4) + req.url;
        } else {
          finalUrl = apiUrl + (req.url.startsWith('/') ? '' : '/') + req.url;
        }
      }
    } else {
      // Local: environment.apiUrl is relative (e.g., /api)
      if (!req.url.startsWith(apiUrl)) {
        finalUrl = apiUrl + (req.url.startsWith('/') ? '' : '/') + req.url;
      }
    }
  }

  const token = localStorage.getItem('token');
  const authReq = token ? addToken(req.clone({ url: finalUrl }), token) : req.clone({ url: finalUrl });

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        if (req.url.includes('/auth/')) {
          console.warn('[JWT Interceptor] Auth endpoint returned 401, not attempting refresh');
          return throwError(() => err);
        }
        console.warn('[JWT Interceptor] 401 Detected, attempting token refresh...');
        return handle401(req, next, authService, authStore);
      }
      if (err.status === 403) {
        console.warn('[JWT Interceptor] 403 Forbidden for:', req.url);
        return throwError(() => err);
      }
      return throwError(() => err);
    })
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authStore: any // Using any for signalStore to avoid complex type issues in interceptor
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
      console.log('[JWT Interceptor] Token refreshed successfully');
      isRefreshing = false;
      
      // Update both LocalStorage and Signal State
      authStore.updateFromResponse(res);
      
      refreshSubject.next(res.token);
      return next(addToken(req, res.token));
    }),
    catchError(err => {
      console.error('[JWT Interceptor] Refresh failed, logging out...');
      isRefreshing = false;
      
      // Use Store logout for clean state removal
      authStore.logout();
      
      return throwError(() => err);
    })
  );
}
