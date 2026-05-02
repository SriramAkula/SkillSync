import { Component, inject, OnInit, Output, EventEmitter, signal, HostListener, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStore } from '../../core/store/auth.store';
import { NotificationStore } from '../../core/store/notification.store';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { NotificationDto } from '../../shared/models';

type NotifCategory = 'all' | 'messages' | 'sessions';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ThemeToggleComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  readonly authStore = inject(AuthStore);
  readonly notifStore = inject(NotificationStore);
  private readonly router = inject(Router);

  readonly dropdownOpen = signal(false);
  readonly notifPanelOpen = signal(false);
  readonly activeTab = signal<NotifCategory>('all');

  readonly displayRole = computed(() => {
    if (this.authStore.isAdmin()) return 'Administrator';
    if (this.authStore.isMentor()) return 'Mentor';
    return 'Learner';
  });

  filteredNotifs = computed(() => {
    const list = this.notifStore.notifications();
    return list.slice(0, 5);
  });

  ngOnInit(): void {
    this.notifStore.loadAll();
    this.notifStore.startPolling();
  }

  initial(): string {
    const u = this.authStore.username();
    return u ? u[0].toUpperCase() : '?';
  }

  getIconAttr(type: string): { icon: string, bg: string } {
    const up = type.toUpperCase();
    if (up.includes('SESSION') || up.includes('MENTOR')) return { icon: 'event', bg: '#8b5cf6' };
    if (up.includes('MESSAGE') || up.includes('REVIEW')) return { icon: 'chat_bubble', bg: '#ec4899' };
    return { icon: 'notifications', bg: '#f59e0b' };
  }

  toggleNotifPanel(): void {
    this.notifPanelOpen.update(v => !v);
    this.dropdownOpen.set(false);
  }

  markAll(): void {
    const unreadNotifs = this.notifStore.unread();
    if (unreadNotifs.length === 0) {
      this.notifPanelOpen.set(false);
      return;
    }
    
    // Mark all notifications as read
    unreadNotifs.forEach(n => {
      this.notifStore.markRead(n.id);
    });
    
    // Close dropdown after a brief delay to let updates process
    setTimeout(() => {
      this.notifPanelOpen.set(false);
    }, 300);
  }

  onNotifClick(n: NotificationDto): void {
    if (!n.isRead) {
      this.notifStore.markRead(n.id);
    }
    this.notifPanelOpen.set(false);

    const type = n.type.toUpperCase();
    if (type === 'SESSION_REQUESTED' && this.authStore.isMentor()) {
      this.router.navigate(['/mentor-dashboard']);
    } else if (type.includes('SESSION')) {
      this.router.navigate(['/sessions']);
    } else if (type.includes('PROFILE')) {
      this.router.navigate(['/profile']);
    }
  }

  formatTime(iso: string | null | undefined): string {
    if (!iso) return '';
    // Append 'Z' to treat as UTC if no timezone indicator exists
    const date = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  formatMessage(msg: string): string {
    if (!msg) return '';
    // RegEx to find ISO strings like 2026-04-17T08:08
    const isoRegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?)/g;
    return msg.replace(isoRegex, (match) => {
      try {
        // Append 'Z' to treat as UTC if no timezone indicator exists
        const d = new Date(match.endsWith('Z') || match.includes('+') ? match : match + 'Z');
        // Format to 17-04-2026 08:08 AM
        const datePart = d.toLocaleDateString('en-GB').replace(/\//g, '-'); // en-GB gives DD/MM/YYYY
        const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${datePart} ${timePart}`;
      } catch {
        return match;
      }
    });
  }

  logout(): void {
    this.dropdownOpen.set(false);
    this.notifStore.stopPolling();
    this.authStore.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.profile-dropdown')) this.dropdownOpen.set(false);
    if (!target.closest('.notif-btn') && !target.closest('.glass-card')) this.notifPanelOpen.set(false);
  }
}
