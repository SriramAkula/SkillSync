import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import {
  AuthResponse, LoginRequest, RegisterRequest,
  OtpVerifyRequest, GoogleTokenRequest
} from '../../shared/models';

interface AuthState {
  token: string | null;
  userId: number | null;
  email: string | null;
  username: string | null;
  roles: string[];
  loading: boolean;
  error: string | null;
  otpSent: boolean;
  otpVerified: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
  email: localStorage.getItem('email'),
  username: localStorage.getItem('username'),
  roles: JSON.parse(localStorage.getItem('roles') ?? '[]'),
  loading: false,
  error: null,
  otpSent: false,
  otpVerified: false
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>(initialState),

  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.token()),
    isAdmin: computed(() => store.roles().includes('ROLE_ADMIN')),
    isMentor: computed(() => store.roles().includes('ROLE_MENTOR')),
    isLearner: computed(() => store.roles().includes('ROLE_LEARNER')),
    canApplyToBeMentor: computed(() => store.roles().includes('ROLE_LEARNER') && !store.roles().includes('ROLE_MENTOR')),
    hasRole: computed(() => (role: string) => store.roles().includes(role))
  })),

  withMethods((store, authService = inject(AuthService), router = inject(Router)) => ({

    sendOtp: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(email =>
          authService.sendOtp(email).pipe(
            tapResponse({
              next: () => patchState(store, { loading: false, otpSent: true }),
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message ?? 'Failed to send OTP' })
            })
          )
        )
      )
    ),

    verifyOtp: rxMethod<OtpVerifyRequest>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(req =>
          authService.verifyOtp(req.email, req.otp).pipe(
            tapResponse({
              next: () => patchState(store, { loading: false, otpVerified: true }),
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message ?? 'Invalid OTP' })
            })
          )
        )
      )
    ),

    register: rxMethod<RegisterRequest>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(req =>
          authService.register(req).pipe(
            tapResponse({
              next: (res) => {
                persistAuth(res);
                const claims = decodeJwt(res.token);
                patchState(store, {
                  token: res.token,
                  roles: res.roles ?? claims.roles ?? [],
                  userId: claims.userId ?? null,
                  email: claims.sub ?? null,
                  username: claims.sub ?? null,
                  loading: false, error: null
                });
                router.navigate(['/mentors']);
              },
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message ?? 'Registration failed' })
            })
          )
        )
      )
    ),

    login: rxMethod<LoginRequest>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(req =>
          authService.login(req).pipe(
            tapResponse({
              next: (res) => {
                persistAuth(res);
                const claims = decodeJwt(res.token);
                patchState(store, {
                  token: res.token,
                  roles: res.roles ?? claims.roles ?? [],
                  userId: claims.userId ?? null,
                  email: claims.sub ?? null,
                  username: claims.sub ?? null,
                  loading: false, error: null
                });
                router.navigate(['/mentors']);
              },
              error: (err: any) => {
                const msg = err.error?.message ?? 'Invalid credentials';
                if (msg.toLowerCase().includes('user not found')) {
                  router.navigate(['/auth/register'], { queryParams: { email: req.email } });
                  patchState(store, { loading: false, error: 'User not found. Please register to continue.' });
                } else {
                  patchState(store, { loading: false, error: msg });
                }
              }
            })
          )
        )
      )
    ),

    googleLogin: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(idToken =>
          authService.googleLogin(idToken).pipe(
            tapResponse({
              next: (res) => {
                persistAuth(res);
                const claims = decodeJwt(res.token);
                patchState(store, {
                  token: res.token,
                  roles: res.roles ?? claims.roles ?? [],
                  userId: claims.userId ?? null,
                  email: claims.sub ?? null,
                  username: claims.sub ?? null,
                  loading: false, error: null
                });
                router.navigate(['/mentors']);
              },
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message ?? 'Google login failed' })
            })
          )
        )
      )
    ),

    refreshToken(): void {
      const token = store.token();
      if (!token) return;
      authService.refreshToken(token).subscribe({
        next: (res) => {
          persistAuth(res);
          patchState(store, { token: res.token });
        },
        error: () => this.logout()
      });
    },

    logout(): void {
      clearAuth();
      patchState(store, { ...initialState, token: null, userId: null, roles: [], email: null, username: null });
      router.navigate(['/auth/login']);
    },

    addRole(role: string): void {
      if (!store.roles().includes(role)) {
        const newRoles = [...store.roles(), role];
        patchState(store, { roles: newRoles });
        // Update localStorage to keep state across manual reloads
        localStorage.setItem('roles', JSON.stringify(newRoles));
      }
    },

    clearError(): void {
      patchState(store, { error: null });
    }
  }))
);

function persistAuth(res: AuthResponse): void {
  const claims = decodeJwt(res.token);
  localStorage.setItem('token', res.token);
  localStorage.setItem('userId', String(claims.userId ?? res.userId ?? ''));
  localStorage.setItem('email', claims.sub ?? res.email ?? '');
  localStorage.setItem('username', res.username ?? claims.sub ?? '');
  localStorage.setItem('roles', JSON.stringify(res.roles ?? claims.roles ?? []));
}

function clearAuth(): void {
  ['token', 'userId', 'email', 'username', 'roles'].forEach(k => localStorage.removeItem(k));
}

function decodeJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch { return {}; }
}
