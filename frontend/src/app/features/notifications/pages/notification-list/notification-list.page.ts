import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationStore } from '../../../../core/auth/notification.store';
import { AuthStore } from '../../../../core/auth/auth.store';
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

  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  onNotifClick(n: NotificationDto): void {
    if (!n.isRead) {
      this.notifStore.markRead(n.id);
    }
    
    const type = n.type.toUpperCase();
    if (type === 'SESSION_REQUESTED' && this.authStore.isMentor()) {
      this.router.navigate(['/mentor-dashboard']);
    } else if (type.includes('SESSION')) {
      this.router.navigate(['/sessions']);
    } else if (type.includes('PROFILE')) {
      this.router.navigate(['/profile']);
    }
  }

  formatMessage(msg: string): string {
    if (!msg) return '';
    const isoRegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?)/g;
    return msg.replace(isoRegex, (match) => {
      try {
        // Append 'Z' to treat as UTC if no timezone indicator exists
        const d = new Date(match.endsWith('Z') || match.includes('+') ? match : match + 'Z');
        const datePart = d.toLocaleDateString('en-GB').replace(/\//g, '-');
        const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${datePart} ${timePart}`;
      } catch {
        return match;
      }
    });
  }
}
