import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
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
      console.error(`HTTP Error ${err.status}:`, err.message, 'URL:', finalUrl);
      
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
      console.error('HTTP request failed:', err.status, err.statusText);
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
      localStorage.setItem('token', res.token);
      refreshSubject.next(res.token);
      return next(addToken(req, res.token));
    }),
    catchError(err => {
      isRefreshing = false;
      localStorage.clear();
      router.navigate(['/auth/login']);
      return throwError(() => err);
    })
  );
}
