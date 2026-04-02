import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationStore } from '../../../../core/auth/notification.store';
import { NotificationDto } from '../../../../shared/models';

type NotifCategory = 'all' | 'messages' | 'sessions';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="header-wrap">
        <h2>Notifications</h2>
        @if (notifStore.unreadCount() > 0) {
          <button class="mark-all-btn" (click)="markAll()">Mark all as read</button>
        }
      </div>

      <div class="tabs-wrap">
        <button class="notif-tab" [class.active]="activeTab() === 'all'" (click)="activeTab.set('all')">
          All ({{ tabCounts().all }})
        </button>
        <button class="notif-tab" [class.active]="activeTab() === 'messages'" (click)="activeTab.set('messages')">
          Messages ({{ tabCounts().messages }})
        </button>
        <button class="notif-tab" [class.active]="activeTab() === 'sessions'" (click)="activeTab.set('sessions')">
          Sessions ({{ tabCounts().sessions }})
        </button>
      </div>

      <div class="notif-list-container">
        @for (group of groupedNotifs(); track group.label) {
          <div class="date-group">
            <h3 class="date-label">{{ group.label }}</h3>
            <div class="notif-cards">
              @for (n of group.items; track n.id) {
                <div class="notif-card" [class.unread]="!n.isRead" (click)="onNotifClick(n)">
                  <div class="notif-icon" [style.background]="getIconAttr(n.type).bg">
                    <span class="material-icons" [style.color]="getIconAttr(n.type).color">
                      {{ getIconAttr(n.type).icon }}
                    </span>
                  </div>
                  
                  <div class="notif-content">
                    <p class="notif-message" [class.bold]="!n.isRead">{{ n.message }}</p>
                    <span class="notif-time">{{ formatTime(n.createdAt) }}</span>
                  </div>

                  @if (!n.isRead) {
                    <span class="unread-dot"></span>
                  }
                  
                  <button class="remove-btn" (click)="deleteNotif($event, n.id)">
                    <span class="material-icons">delete_outline</span>
                  </button>
                </div>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <span class="material-icons">celebration</span>
            <h3>🎉 You're all caught up!</h3>
            <p>No new notifications match these filters right now.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 800px; margin: 40px auto; padding: 0 20px;
    }
    .header-wrap {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
    }
    .header-wrap h2 {
      margin: 0; font-size: 28px; font-weight: 800; color: var(--text-main);
    }
    .mark-all-btn {
      background: none; border: none; color: var(--primary); font-weight: 600;
      font-size: 14px; cursor: pointer; padding: 8px 16px; border-radius: 8px;
      transition: background 0.15s;
    }
    .mark-all-btn:hover { background: rgba(79, 70, 229, 0.1); }
    
    .tabs-wrap {
      display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--border-main);
      padding-bottom: 12px;
    }
    .notif-tab {
      padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;
      background: none; border: none; cursor: pointer; color: var(--text-muted);
      transition: all 0.15s ease;
    }
    .notif-tab.active { background: var(--primary); color: white; }
    
    .date-label {
      font-size: 13px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 12px;
    }
    
    .notif-cards {
      display: flex; flex-direction: column; gap: 8px;
    }
    .notif-card {
      display: flex; align-items: center; gap: 16px;
      padding: 16px 20px; background: var(--bg-card);
      border-radius: 12px; border: 1px solid var(--border-main);
      cursor: pointer; transition: all 0.2s ease;
    }
    .notif-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
    .notif-card.unread { background: rgba(99,102,241,0.03); border-color: rgba(99,102,241,0.2); }
    
    .notif-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .notif-icon .material-icons { font-size: 24px; }
    
    .notif-content { flex: 1; margin: 0 8px; }
    .notif-message { margin: 0 0 6px; font-size: 15px; color: var(--text-main); line-height: 1.4; }
    .notif-message.bold { font-weight: 700; }
    .notif-time { font-size: 13px; color: var(--text-muted); }
    
    .unread-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--primary); flex-shrink: 0; box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
    }
    
    .remove-btn {
      background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 8px;
      border-radius: 8px; display: flex; transition: color 0.15s, background 0.15s;
    }
    .remove-btn:hover { color: #ef4444; background: #fee2e2; }
    
    .empty-state {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: 80px 20px; color: var(--text-muted);
    }
    .empty-state .material-icons { font-size: 48px; color: #f59e0b; margin-bottom: 16px; }
    .empty-state h3 { font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0 0 8px; }
    .empty-state p { font-size: 15px; margin: 0; }
  `]
})
export class NotificationListPage implements OnInit {
  readonly notifStore = inject(NotificationStore);
  private readonly router = inject(Router);

  readonly activeTab = signal<NotifCategory>('all');

  ngOnInit(): void {
    if (this.notifStore.notifications().length === 0) {
      this.notifStore.loadAll();
    }
  }

  tabCounts = computed(() => {
    const list = this.notifStore.notifications();
    return {
      all: list.length,
      sessions: list.filter(n => n.type.includes('SESSION') || n.type.includes('MENTOR')).length,
      messages: list.filter(n => n.type.includes('MESSAGE') || n.type.includes('REVIEW')).length
    };
  });

  groupedNotifs = computed(() => {
    let list = this.notifStore.notifications();
    const tab = this.activeTab();
    if (tab === 'sessions') list = list.filter(n => n.type.includes('SESSION') || n.type.includes('MENTOR'));
    else if (tab === 'messages') list = list.filter(n => n.type.includes('MESSAGE') || n.type.includes('REVIEW'));

    const groups = new Map<string, NotificationDto[]>();
    for (const n of list) {
      const key = this.formatGroupKey(n.createdAt);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(n);
    }
    return [
      { label: 'Today', items: groups.get('Today') || [] },
      { label: 'Yesterday', items: groups.get('Yesterday') || [] },
      { label: 'Last Week', items: groups.get('Last Week') || [] },
      { label: 'Older', items: groups.get('Older') || [] }
    ].filter(g => g.items.length > 0);
  });

  formatGroupKey(iso: string | null | undefined): string {
    if (!iso) return 'Today';
    const d = new Date(iso);
    const now = new Date();
    
    if (d.toDateString() === now.toDateString()) return 'Today';
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    const diff = now.getTime() - d.getTime();
    if (diff < 7 * 24 * 60 * 60 * 1000) return 'Last Week';
    return 'Older';
  }

  getIconAttr(type: string): { icon: string, color: string, bg: string } {
    const up = type.toUpperCase();
    if (up.includes('SESSION') || up.includes('MENTOR')) return { icon: 'event', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' }; 
    if (up.includes('MESSAGE') || up.includes('REVIEW')) return { icon: 'chat_bubble_outline', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' }; 
    if (up.includes('ACTION') || up.includes('ALERT')) return { icon: 'warning', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' }; 
    return { icon: 'notifications', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }; 
  }

  formatTime(iso: string | null | undefined): string {
    if (!iso) return 'just now';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  markAll(): void {
    this.notifStore.unread().forEach(n => this.notifStore.markRead(n.id));
  }

  onNotifClick(n: NotificationDto): void {
    if (!n.isRead) {
      this.notifStore.markRead(n.id);
    }
    
    if (n.type.includes('SESSION')) {
       this.router.navigate(['/sessions']);
    } else if (n.type.includes('PROFILE')) {
       this.router.navigate(['/profile']);
    }
  }

  deleteNotif(e: Event, id: number): void {
    e.stopPropagation();
    this.notifStore.deleteNotification(id);
  }
}
