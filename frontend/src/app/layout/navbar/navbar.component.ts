import { Component, inject, OnInit, Output, EventEmitter, signal, HostListener, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { NotificationStore } from '../../core/auth/notification.store';
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

    if (n.type.includes('SESSION')) {
      this.router.navigate(['/sessions']);
    } else if (n.type.includes('PROFILE')) {
      this.router.navigate(['/profile']);
    }
  }

  formatTime(iso: string | null | undefined): string {
    if (!iso) return 'now';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
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
