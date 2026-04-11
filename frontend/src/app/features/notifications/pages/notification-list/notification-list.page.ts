import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStore } from '../../../../core/auth/notification.store';

import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

type NotifFilter = 'all' | 'unread';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './notification-list.page.html',
  styleUrl: './notification-list.page.scss'
})
export class NotificationListPage implements OnInit {
  readonly notifStore = inject(NotificationStore);
  readonly filter = signal<NotifFilter>('all');
  
  readonly activeTabPos = computed(() => {
    const f = this.filter();
    if (f === 'unread') return 50;
    return 0;
  });

  updateFilter(f: NotifFilter) {
    this.filter.set(f);
    this.notifStore.loadAll({ page: 0, size: 15, unreadOnly: f === 'unread' });
  }

  ngOnInit(): void { 
    this.notifStore.loadAll({ page: 0, size: 15 }); 
  }

  onPageChange(page: number): void {
    this.notifStore.loadAll({ page, size: 15, unreadOnly: this.filter() === 'unread' });
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
