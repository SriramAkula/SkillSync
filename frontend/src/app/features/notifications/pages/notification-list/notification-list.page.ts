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
    <div class="max-w-3xl mx-auto py-12 px-6">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-3xl font-black text-slate-900 dark:text-white">Notifications</h2>
        @if (notifStore.unreadCount() > 0) {
          <button (click)="markAll()" class="text-xs font-bold text-indigo-600 dark:text-indigo-400">Mark all as read</button>
        }
      </div>

      <div class="space-y-4">
        @for (n of notifStore.notifications(); track n.id) {
          <div class="p-6 bg-white dark:bg-slate-900 border rounded-3xl flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
               <span class="material-icons text-slate-400 dark:text-slate-500">notifications</span>
            </div>
            <div class="flex-1">
              <p class="font-bold text-slate-800 dark:text-slate-200">{{ n.message }}</p>
            </div>
          </div>
        } @empty {
          <p class="text-center py-20 text-slate-500 dark:text-slate-400">No notifications.</p>
        }
      </div>
    </div>
  `
})
export class NotificationListPage implements OnInit {
  readonly notifStore = inject(NotificationStore);
  ngOnInit(): void { if (this.notifStore.notifications().length === 0) this.notifStore.loadAll(); }
  markAll(): void { this.notifStore.unread().forEach(n => this.notifStore.markRead(n.id)); }
}
