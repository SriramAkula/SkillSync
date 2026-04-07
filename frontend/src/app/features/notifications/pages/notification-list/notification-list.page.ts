import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStore } from '../../../../core/auth/notification.store';
import { NotificationDto } from '../../../../shared/models';

type NotifFilter = 'all' | 'unread';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-main">
          <h1>Notifications</h1>
          <p>Stay updated with your activities</p>
        </div>
        <div class="header-actions">
          @if (notifStore.unreadCount() > 0) {
            <button (click)="notifStore.markAllRead()" class="btn-action secondary">
              <span class="material-icons">done_all</span>
              Mark All Read
            </button>
          }
           @if (notifStore.notifications().length > 0) {
            <button (click)="notifStore.deleteAll()" class="btn-action danger">
              <span class="material-icons">delete_sweep</span>
              Delete All
            </button>
          }
        </div>
      </header>

      <!-- Filter Tabs -->
      <nav class="filter-tabs">
        <div class="pill-track">
          <div class="pill-active" [style.left.%]="activeTabPos"></div>
          <button (click)="filter.set('all')" [class.active]="filter() === 'all'">
            All <span>{{ notifStore.notifications().length }}</span>
          </button>
          <button (click)="filter.set('unread')" [class.active]="filter() === 'unread'">
            Unread <span>{{ notifStore.unreadCount() }}</span>
          </button>
        </div>
      </nav>

      <!-- Notifications List -->
      <main class="notifications-list">
        @for (n of filteredNotifications(); track n.id) {
          <div class="notif-card" [class.unread]="!n.isRead">
            <div class="notif-icon-wrap" [ngClass]="notifIcon(n.type).class">
              <span class="material-icons">{{ notifIcon(n.type).icon }}</span>
            </div>
            
            <div class="notif-content">
              <div class="notif-header">
                <span class="notif-type">{{ n.type.replace('_', ' ') }}</span>
                <span class="notif-time">{{ n.createdAt | date:'shortTime' }}</span>
              </div>
              <p class="notif-message">{{ n.message }}</p>
              <span class="notif-date">{{ n.createdAt | date:'longDate' }}</span>
            </div>

            <div class="notif-actions">
              @if (!n.isRead) {
                <button (click)="notifStore.markRead(n.id)" title="Mark as read" class="btn-item-action read">
                  <span class="material-icons">done</span>
                </button>
              }
              <button (click)="notifStore.deleteNotification(n.id)" title="Delete" class="btn-item-action delete">
                <span class="material-icons">delete_outline</span>
              </button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <div class="empty-icon-ring">
              <span class="material-icons">notifications_off</span>
            </div>
            <h3>Nothing here</h3>
            <p>You're all caught up! No notifications for your current filter.</p>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .notifications-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
      min-height: 100vh;
    }

    /* --- Page Header --- */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .header-main h1 {
      font-size: 2.5rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      margin: 0;
      background: linear-gradient(135deg, #1e293b, #475569);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    :host-context(.dark) .header-main h1 {
      background: linear-gradient(135deg, #f8fafc, #cbd5e1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-main p {
      color: #64748b;
      margin: 0.25rem 0 0;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-action {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-action.secondary {
      background: #f1f5f9;
      color: #475569;
    }
    .btn-action.secondary:hover {
      background: #e2e8f0;
    }
    :host-context(.dark) .btn-action.secondary {
      background: #1e293b;
      color: #94a3b8;
    }

    .btn-action.danger {
      background: #fef2f2;
      color: #dc2626;
    }
    .btn-action.danger:hover {
      background: #fee2e2;
    }
    :host-context(.dark) .btn-action.danger {
      background: rgba(220, 38, 38, 0.1);
      color: #f87171;
    }

    /* --- Filter Tabs --- */
    .filter-tabs {
      margin-bottom: 2rem;
    }

    .pill-track {
      display: flex;
      background: rgba(226, 232, 240, 0.5);
      padding: 0.375rem;
      border-radius: 1.25rem;
      position: relative;
      width: fit-content;
    }
    :host-context(.dark) .pill-track {
      background: rgba(30, 41, 59, 0.5);
    }

    .pill-active {
      position: absolute;
      top: 0.375rem;
      bottom: 0.375rem;
      width: calc(50% - 0.375rem);
      background: white;
      border-radius: 0.875rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    :host-context(.dark) .pill-active {
      background: #334155;
    }

    .pill-track button {
      position: relative;
      flex: 1;
      padding: 0.625rem 1.5rem;
      border: none;
      background: none;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 100px;
    }

    .pill-track button span {
      background: #f1f5f9;
      padding: 0.125rem 0.5rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      opacity: 0.7;
    }
    :host-context(.dark) .pill-track button span {
      background: #1e293b;
    }

    .pill-track button.active {
      color: #0f172a;
    }
    :host-context(.dark) .pill-track button.active {
      color: #f8fafc;
    }

    /* --- Notif List --- */
    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .notif-card {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(226, 232, 240, 0.7);
      border-radius: 1.5rem;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    :host-context(.dark) .notif-card {
      background: rgba(15, 23, 42, 0.6);
      border-color: rgba(30, 41, 59, 0.7);
    }

    .notif-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      border-color: #cbd5e1;
    }
    :host-context(.dark) .notif-card:hover {
      border-color: #334155;
    }

    .notif-card.unread {
      background: white;
      border-left: 4px solid #4f46e5;
    }
    :host-context(.dark) .notif-card.unread {
      background: rgba(30, 41, 59, 0.8);
      border-left-color: #6366f1;
    }

    .notif-icon-wrap {
      width: 3.5rem;
      height: 3.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 1.125rem;
      flex-shrink: 0;
    }

    .notif-icon-wrap.info { background: #f0f9ff; color: #0ea5e9; }
    .notif-icon-wrap.success { background: #f0fdf4; color: #22c55e; }
    .notif-icon-wrap.warning { background: #fffbeb; color: #f59e0b; }
    .notif-icon-wrap.danger { background: #fef2f2; color: #ef4444; }
    :host-context(.dark) .notif-icon-wrap.info { background: rgba(14, 165, 233, 0.1); }
    :host-context(.dark) .notif-icon-wrap.success { background: rgba(34, 197, 94, 0.1); }
    :host-context(.dark) .notif-icon-wrap.warning { background: rgba(245, 158, 11, 0.1); }
    :host-context(.dark) .notif-icon-wrap.danger { background: rgba(239, 68, 68, 0.1); }

    .notif-icon-wrap .material-icons { font-size: 1.5rem; }

    .notif-content {
      flex: 1;
      min-width: 0;
    }

    .notif-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.375rem;
    }

    .notif-type {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
    }

    .notif-time {
      font-size: 0.75rem;
      color: #64748b;
    }

    .notif-message {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem;
      line-height: 1.5;
    }
    :host-context(.dark) .notif-message {
      color: #f1f5f9;
    }

    .notif-date {
      font-size: 0.8125rem;
      color: #94a3b8;
    }

    .notif-actions {
      display: flex;
      gap: 0.5rem;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .notif-card:hover .notif-actions {
      opacity: 1;
    }

    .btn-item-action {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-item-action.read { background: #f1f5f9; color: #4f46e5; }
    .btn-item-action.read:hover { background: #e2e8f0; }
    .btn-item-action.delete { background: #fef2f2; color: #ef4444; }
    .btn-item-action.delete:hover { background: #fee2e2; }
    :host-context(.dark) .btn-item-action.read { background: #1e293b; }
    :host-context(.dark) .btn-item-action.delete { background: rgba(239, 68, 68, 0.1); }

    /* --- Empty State --- */
    .empty-state {
      text-align: center;
      padding: 5rem 1rem;
    }

    .empty-icon-ring {
      width: 5rem;
      height: 5rem;
      background: #f1f5f9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      color: #94a3b8;
    }
    :host-context(.dark) .empty-icon-ring {
      background: #1e293b;
    }

    .empty-icon-ring .material-icons { font-size: 2.5rem; }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    :host-context(.dark) .empty-state h3 { color: #f1f5f9; }

    .empty-state p {
      color: #64748b;
    }

    @media (max-width: 640px) {
      .page-header { align-items: flex-start; }
      .header-actions { width: 100%; justify-content: flex-start; }
      .pill-track { width: 100%; }
      .pill-active { width: calc(33.33% - 0.25rem); }
      .notif-actions { opacity: 1; margin-top: 1rem; width: 100%; justify-content: flex-end; }
      .notif-card { flex-wrap: wrap; }
    }
  `]
})
export class NotificationListPage implements OnInit {
  readonly notifStore = inject(NotificationStore);
  
  readonly filter = signal<NotifFilter>('all');
  
  readonly filteredNotifications = computed(() => {
    const all = this.notifStore.notifications();
    const f = this.filter();
    if (f === 'unread') return all.filter(n => !n.isRead);
    return all;
  });

  readonly activeTabPos = computed(() => {
    const f = this.filter();
    if (f === 'unread') return 50;
    return 0;
  });

  ngOnInit(): void { 
    if (this.notifStore.notifications().length === 0) {
      this.notifStore.loadAll(); 
    }
  }

  notifIcon(type: string): { icon: string; class: string } {
    switch (type) {
      case 'MENTOR_APPROVED': return { icon: 'volunteer_activism', class: 'success' };
      case 'SESSION_REQUESTED': return { icon: 'event_note', class: 'info' };
      case 'SESSION_CONFIRMED': return { icon: 'event_available', class: 'success' };
      case 'SESSION_CANCELLED': return { icon: 'event_busy', class: 'danger' };
      case 'PAYMENT_SUCCESSFUL': return { icon: 'payments', class: 'success' };
      default: return { icon: 'notifications', class: 'warning' };
    }
  }
}
