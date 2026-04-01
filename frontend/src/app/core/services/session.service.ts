import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SessionDto, RequestSessionRequest } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/session`;

  requestSession(req: RequestSessionRequest): Observable<ApiResponse<SessionDto>> {
    return this.http.post<ApiResponse<SessionDto>>(`${this.base}/request`, req);
  }

  getSession(id: number): Observable<ApiResponse<SessionDto>> {
    return this.http.get<ApiResponse<SessionDto>>(`${this.base}/${id}`);
  }

  getLearnerSessions(): Observable<ApiResponse<SessionDto[]>> {
    return this.http.get<ApiResponse<SessionDto[]>>(`${this.base}/learner/list`);
  }

  getMentorSessions(): Observable<ApiResponse<SessionDto[]>> {
    return this.http.get<ApiResponse<SessionDto[]>>(`${this.base}/mentor/list`);
  }

  acceptSession(id: number): Observable<ApiResponse<SessionDto>> {
    return this.http.put<ApiResponse<SessionDto>>(`${this.base}/${id}/accept`, null);
  }

  rejectSession(id: number, reason: string): Observable<ApiResponse<SessionDto>> {
    return this.http.put<ApiResponse<SessionDto>>(`${this.base}/${id}/reject`, null, { params: { reason } });
  }

  cancelSession(id: number): Observable<ApiResponse<SessionDto>> {
    return this.http.put<ApiResponse<SessionDto>>(`${this.base}/${id}/cancel`, null);
  }
}
