import { computed, inject, OnDestroy } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap, interval, Subscription } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { NotificationDto } from '../../shared/models';
import { environment } from '../../../environments/environment';
import { AuthStore } from './auth.store';

interface NotificationState {
  notifications: NotificationDto[];
  unreadCount: number;
  loading: boolean;
}

export const NotificationStore = signalStore(
  { providedIn: 'root' },
  withState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: false
  }),

  withComputed((store) => ({
    unread: computed(() => store.notifications().filter(n => !n.isRead)),
    hasUnread: computed(() => store.unreadCount() > 0)
  })),

  withMethods((store, svc = inject(NotificationService), authStore = inject(AuthStore)) => {
    // ── Polling subscription (swap for SSE later without touching components) ──
    let pollSub: Subscription | null = null;

    return {
      loadAll: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            svc.getAll().pipe(
              tapResponse({
                next: (res) => patchState(store, { notifications: res.data, loading: false }),
                error: () => patchState(store, { loading: false })
              })
            )
          )
        )
      ),

      refreshUnreadCount: rxMethod<void>(
        pipe(
          switchMap(() =>
            svc.getUnreadCount().pipe(
              tapResponse({
                next: (res) => patchState(store, { unreadCount: res.data }),
                error: () => {}
              })
            )
          )
        )
      ),

      markRead: rxMethod<number>(
        pipe(
          switchMap(id =>
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
                error: () => {}
              })
            )
          )
        )
      ),

      deleteNotification: rxMethod<number>(
        pipe(
          switchMap(id =>
            svc.delete(id).pipe(
              tapResponse({
                next: () => patchState(store, {
                  notifications: store.notifications().filter(n => n.id !== id)
                }),
                error: () => {}
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
              const unread = res.data || [];
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
                authStore.refreshToken(undefined);
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
      }
    };
  })
);
