import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, mergeMap, tap, interval, Subscription } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import type { NotificationDto } from '../../shared/models';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthStore } from './auth.store';

interface NotificationState {
  notifications: NotificationDto[];
  unreadCount: number;
  loading: boolean;
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export const NotificationStore = signalStore(
  { providedIn: 'root' },
  withState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: false,
    currentPage: 0,
    pageSize: 15,
    totalElements: 0,
    totalPages: 0
  }),

  withComputed((store) => ({
    unread: computed(() => store.notifications().filter(n => !n.isRead)),
    hasUnread: computed(() => store.unreadCount() > 0)
  })),

  withMethods((store, svc = inject(NotificationService), authStore = inject(AuthStore)) => {
    // ── Polling subscription (swap for SSE later without touching components) ──
    let pollSub: Subscription | null = null;

    return {
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

      refreshUnreadCount: rxMethod<void>(
        pipe(
          switchMap(() =>
            svc.getUnreadCount().pipe(
              tapResponse({
                next: (res) => patchState(store, { unreadCount: res.data }),
                error: (err: HttpErrorResponse) => console.error('Failed to refresh unread count', err)
              })
            )
          )
        )
      ),

      markRead: rxMethod<number>(
        pipe(
          mergeMap((id: number) =>
            svc.markAsRead(id).pipe(
              tapResponse({
                next: () => {
                  patchState(store, {
                    notifications: store.notifications().map(n =>
                      n.id === id ? { ...n, isRead: true } : n
                    ),
                    unreadCount: Math.max(0, store.unreadCount() - 1)
                  });
                },
                error: (err: HttpErrorResponse) => console.error('Failed to mark notification as read', err)
              })
            )
          )
        )
      ),

      deleteNotification: rxMethod<number>(
        pipe(
          mergeMap((id: number) =>
            svc.delete(id).pipe(
              tapResponse({
                next: () => patchState(store, {
                  notifications: store.notifications().filter(n => n.id !== id),
                  unreadCount: store.notifications().find(n => n.id === id)?.isRead === false 
                    ? Math.max(0, store.unreadCount() - 1) 
                    : store.unreadCount()
                }),
                error: (err: HttpErrorResponse) => console.error('Failed to delete notification', err)
              })
            )
          )
        )
      ),

      // ── Polling: call startPolling() on app init, stopPolling() on logout ──
      // To upgrade to SSE: replace interval() with svc.streamNotifications()
      startPolling(): void {
        if (pollSub) return;
        pollSub = interval(environment.pollIntervalMs).subscribe(() => {
          svc.getUnread().subscribe({
            next: (res) => {
              const unread = res.data?.content || [];
              const oldCount = store.unreadCount();
              const newCount = unread.length;
              
              patchState(store, { unreadCount: newCount });
              
              // If we have new notifications, refresh the full list to show them
              if (newCount > oldCount) {
                this.loadAll();
              }
              
              // Automatically sync role if mentor approval notification is detected
              const hasMentorApproval = unread.some(n => n.type === 'MENTOR_APPROVED');
              if (hasMentorApproval && !authStore.isMentor()) {
                authStore.refreshToken();
              }
            }
          });
        });
      },

      stopPolling(): void {
        pollSub?.unsubscribe();
        pollSub = null;
      },

      // ── SSE-ready hook: call this when SSE event arrives ──
      onPushNotification(notification: NotificationDto): void {
        patchState(store, {
          notifications: [notification, ...store.notifications()],
          unreadCount: store.unreadCount() + 1
        });
      },

      markAllRead(): void {
        const unreadIds = store.notifications()
          .filter(n => !n.isRead)
          .map(n => n.id);
        
        if (unreadIds.length === 0) return;
        
        unreadIds.forEach(id => this.markRead(id));
      },

      deleteAll(): void {
        const allIds = store.notifications().map(n => n.id);
        if (allIds.length === 0) return;
        
        if (confirm(`Are you sure you want to delete all ${allIds.length} notifications?`)) {
          allIds.forEach(id => this.deleteNotification(id));
        }
      }
    };
  })
);
