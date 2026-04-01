import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, NotificationDto } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notification`;

  getAll(): Observable<ApiResponse<NotificationDto[]>> {
    return this.http.get<ApiResponse<NotificationDto[]>>(this.base);
  }

  getUnread(): Observable<ApiResponse<NotificationDto[]>> {
    return this.http.get<ApiResponse<NotificationDto[]>>(`${this.base}/unread`);
  }

  getUnreadCount(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.base}/unread/count`);
  }

  markAsRead(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.base}/${id}/read`, null);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }

  // ── SSE upgrade point ──────────────────────────────────────────────────────
  // When backend adds SSE endpoint, replace polling with this:
  // streamNotifications(): Observable<NotificationDto> {
  //   return new Observable(observer => {
  //     const token = localStorage.getItem('token');
  //     const es = new EventSourcePolyfill(`${this.base}/stream`, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     es.onmessage = (e) => observer.next(JSON.parse(e.data));
  //     es.onerror = (e) => observer.error(e);
  //     return () => es.close();
  //   });
  // }
}
