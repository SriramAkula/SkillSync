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

  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        if (req.url.includes('/auth/')) {
          return throwError(() => err);
        }
        return handle401(req, next, authService, router);
      }
      if (err.status === 403) {
        router.navigate(['/unauthorized']);
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
  const currentToken = localStorage.getItem('token');

  if (!currentToken) {
    isRefreshing = false;
    router.navigate(['/auth/login']);
    return throwError(() => new Error('No token'));
  }

  return authService.refreshToken(currentToken).pipe(
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
