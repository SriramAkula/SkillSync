import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, UserProfileDto, UpdateProfileRequest } from '../../shared/models';

const NO_CACHE_HEADERS = new HttpHeaders({
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache'
});

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/user`;

  // ── Shared User State ────────────────────────────────────────────────────────
  private readonly userSubject = new BehaviorSubject<UserProfileDto | null>(null);
  readonly user$ = this.userSubject.asObservable();

  /** Call this once after the initial API load */
  setUser(user: UserProfileDto | null): void {
    this.userSubject.next(user);
  }

  /** Call this after every successful save to push changes to all subscribers */
  updateUser(user: UserProfileDto): void {
    this.userSubject.next(user);
  }

  /** Snapshot of the current user without subscribing */
  get currentUser(): UserProfileDto | null {
    return this.userSubject.getValue();
  }
  // ────────────────────────────────────────────────────────────────────────────

  getMyProfile(): Observable<ApiResponse<UserProfileDto>> {
    return this.http.get<ApiResponse<UserProfileDto>>(`${this.base}/profile`, { headers: NO_CACHE_HEADERS }).pipe(
      map(res => {
        res.data = this.mapProfile(res.data);
        return res;
      })
    );
  }

  getProfile(userId: number): Observable<ApiResponse<UserProfileDto>> {
    return this.http.get<ApiResponse<UserProfileDto>>(`${this.base}/profile/${userId}`, { headers: NO_CACHE_HEADERS }).pipe(
      map(res => {
        res.data = this.mapProfile(res.data);
        return res;
      }),
      catchError(() => {
        const placeholder: UserProfileDto = {
          userId,
          username: `User ${userId}`,
          displayName: 'Unknown User',
          email: `unknown${userId}@skillsync.com`,
          bio: 'Profile details are currently unavailable.'
        } as any;
        return of({ success: true, message: 'Placeholder loaded', data: placeholder });
      })
    );
  }

  updateProfile(req: UpdateProfileRequest): Observable<ApiResponse<UserProfileDto>> {
    return this.http.put<ApiResponse<UserProfileDto>>(`${this.base}/profile`, req).pipe(
      map(res => {
        res.data = this.mapProfile(res.data);
        return res;
      }),
      tap(res => this.updateUser(res.data))
    );
  }

  private mapProfile(p: UserProfileDto): UserProfileDto {
    if (!p) return p;
    if (p.name && !p.firstName) {
      const parts = p.name.trim().split(' ');
      p.firstName = parts[0];
      p.lastName = parts.slice(1).join(' ');
    }
    return p;
  }

  refreshUser(): void {
    this.getMyProfile().subscribe({
      next: res => this.setUser(res.data),
      error: () => this.setUser(null)
    });
  }
}
