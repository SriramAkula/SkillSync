import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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
    return this.http.get<ApiResponse<UserProfileDto>>(`${this.base}/profile`, { headers: NO_CACHE_HEADERS });
  }

  getProfile(userId: number): Observable<ApiResponse<UserProfileDto>> {
    return this.http.get<ApiResponse<UserProfileDto>>(`${this.base}/profile/${userId}`, { headers: NO_CACHE_HEADERS });
  }

  updateProfile(req: UpdateProfileRequest): Observable<ApiResponse<UserProfileDto>> {
    return this.http.put<ApiResponse<UserProfileDto>>(`${this.base}/profile`, req).pipe(
      tap(res => this.updateUser(res.data))
    );
  }

  refreshUser(): void {
    this.getMyProfile().subscribe({
      next: res => this.setUser(res.data),
      error: () => this.setUser(null)
    });
  }
}
