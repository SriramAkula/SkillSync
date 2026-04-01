import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationStore } from '../../../../core/auth/notification.store';

@Component({
  selector: 'app-notification-list-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated on your sessions and mentors</p>
        </div>
        @if (store.unreadCount() > 0) {
          <span class="unread-badge">{{ store.unreadCount() }} unread</span>
        }
      </div>

      @if (store.loading()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <div class="notif-list">
          @for (n of store.notifications(); track n.id) {
            <div class="notif-item" [class.unread]="!n.isRead" (click)="store.markRead(n.id)">
              <div class="notif-icon-wrap" [class.unread-icon]="!n.isRead">
                <span class="material-icons">{{ n.isRead ? 'notifications_none' : 'notifications_active' }}</span>
              </div>
              <div class="notif-body">
                <p class="notif-msg" [class.bold]="!n.isRead">{{ n.message }}</p>
                <span class="notif-time">{{ n.createdAt | date:'short' }}</span>
              </div>
              @if (!n.isRead) { <div class="unread-dot"></div> }
              <button class="delete-btn" (click)="$event.stopPropagation(); store.deleteNotification(n.id)">
                <span class="material-icons">close</span>
              </button>
            </div>
          }
          @empty {
            <div class="empty-state">
              <div class="empty-icon"><span class="material-icons">notifications_off</span></div>
              <h3>All caught up!</h3>
              <p>No notifications yet.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 700px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { font-size: 28px; font-weight: 800; color: #111827; margin: 0 0 4px; }
    .page-header p { color: #6b7280; font-size: 14px; margin: 0; }
    .unread-badge { background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; white-space: nowrap; }

    .notif-list { display: flex; flex-direction: column; gap: 8px; }
    .notif-item {
      display: flex; align-items: center; gap: 14px;
      background: white; border-radius: 14px; padding: 16px;
      border: 1px solid #e5e7eb; cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .notif-item:hover { border-color: #c7d2fe; box-shadow: 0 2px 8px rgba(79,70,229,0.08); }
    .notif-item.unread { background: #eef2ff; border-color: #c7d2fe; }

    .notif-icon-wrap { width: 40px; height: 40px; border-radius: 12px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .notif-icon-wrap .material-icons { font-size: 20px; color: #9ca3af; }
    .notif-icon-wrap.unread-icon { background: #e0e7ff; }
    .notif-icon-wrap.unread-icon .material-icons { color: #4f46e5; }

    .notif-body { flex: 1; min-width: 0; }
    .notif-msg { margin: 0 0 3px; font-size: 14px; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-msg.bold { font-weight: 600; color: #111827; }
    .notif-time { font-size: 12px; color: #9ca3af; }

    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: #4f46e5; flex-shrink: 0; }

    .delete-btn { background: none; border: none; cursor: pointer; color: #d1d5db; padding: 4px; border-radius: 6px; display: flex; align-items: center; transition: color 0.15s, background 0.15s; }
    .delete-btn:hover { color: #ef4444; background: #fee2e2; }
    .delete-btn .material-icons { font-size: 18px; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px; }
    .empty-icon { width: 72px; height: 72px; border-radius: 20px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
    .empty-icon .material-icons { font-size: 36px; color: #9ca3af; }
    .empty-state h3 { font-size: 18px; font-weight: 700; color: #111827; margin: 0; }
    .empty-state p { color: #6b7280; font-size: 14px; margin: 0; }
  `]
})
export class NotificationListPage implements OnInit {
  readonly store = inject(NotificationStore);
  ngOnInit(): void { this.store.loadAll(undefined); }
}
