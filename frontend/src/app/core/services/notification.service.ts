import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, NotificationDto, PageResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notification`;

  getAll(page: number = 0, size: number = 15): Observable<ApiResponse<PageResponse<NotificationDto>>> {
    return this.http.get<ApiResponse<PageResponse<NotificationDto>>>(this.base, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getUnread(page: number = 0, size: number = 15): Observable<ApiResponse<PageResponse<NotificationDto>>> {
    return this.http.get<ApiResponse<PageResponse<NotificationDto>>>(`${this.base}/unread`, {
      params: { page: page.toString(), size: size.toString() }
    });
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
      loadAll: rxMethod<{ page: number; size: number; unreadOnly?: boolean } | void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((params) => {
            const page = typeof params === 'object' ? params?.page ?? store.currentPage() : store.currentPage();
            const size = typeof params === 'object' ? params?.size ?? store.pageSize() : store.pageSize();
            const unreadOnly = typeof params === 'object' ? params?.unreadOnly ?? false : false;
            
            const req = unreadOnly ? svc.getUnread(page, size) : svc.getAll(page, size);
            
            return req.pipe(
              tapResponse({
                next: (res) => patchState(store, { 
                  notifications: res.data.content, 
                  totalElements: res.data.totalElements,
                  totalPages: res.data.totalPages,
                  currentPage: res.data.currentPage,
                  pageSize: res.data.pageSize,
                  loading: false 
                }),
                error: () => patchState(store, { loading: false })
              })
            );
          })
        )
      ),
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
