import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStore } from '../../../../core/auth/notification.store';
import { NotificationDto } from '../../../../shared/models';
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
  
  readonly filteredNotifications = computed(() => {
    const all = this.notifStore.notifications();
    const f = this.filter();
    if (f === 'unread') return all.filter(n => !n.isRead);
    return all;
  });

  readonly currentPage = signal(0);
  readonly pageSize = signal(15);

  readonly pagedNotifications = computed(() => {
    const list = this.filteredNotifications();
    const start = this.currentPage() * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  readonly activeTabPos = computed(() => {
    const f = this.filter();
    if (f === 'unread') return 50;
    return 0;
  });

  updateFilter(f: NotifFilter) {
    this.filter.set(f);
    this.currentPage.set(0); // Reset to first page
  }

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
