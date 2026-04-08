import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStore } from '../../../../core/auth/notification.store';
import { NotificationDto } from '../../../../shared/models';

type NotifFilter = 'all' | 'unread';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-list.page.html',
  styleUrl: './notification-list.page.scss'
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
