import { Component, inject, OnInit, Output, EventEmitter, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { NotificationStore } from '../../core/auth/notification.store';
import { NotificationDto } from '../../shared/models';

type NotifCategory = 'all' | 'messages' | 'sessions';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ThemeToggleComponent],
  template: `
    <nav class="navbar">

      <!-- Left: Hamburger + Brand -->
      <div class="nav-left">
        <button class="hamburger" (click)="menuToggle.emit()" aria-label="Toggle menu">
          <span class="material-icons">menu</span>
        </button>
        <a routerLink="/mentors" class="nav-brand">
          <span class="bolt">⚡</span>
          <span class="brand-name">SkillSync</span>
        </a>
      </div>

      <!-- Right: Actions -->
      <div class="nav-actions">

        <div class="nav-actions-wrap">
          <app-theme-toggle></app-theme-toggle>

          @if (authStore.canApplyToBeMentor()) {
            <a routerLink="/mentors/apply" class="btn-mentor">
              <span class="material-icons">school</span>
              <span class="btn-text">Become a Mentor</span>
            </a>
          }

          <!-- Notification Bell -->
          <div class="notif-wrap">
            <button class="icon-btn" (click)="toggleNotifPanel()" aria-label="Notifications">
              <span class="material-icons">notifications</span>
              @if (notifStore.unreadCount() > 0) {
                <span class="notif-badge">
                  {{ notifStore.unreadCount() > 9 ? '9+' : notifStore.unreadCount() }}
                </span>
              }
            </button>

            @if (notifPanelOpen()) {
              <div class="notif-panel">
                <!-- Header -->
                <div class="notif-panel-header">
                  <span class="panel-title">Notifications</span>
                  @if (notifStore.unreadCount() > 0) {
                    <button class="mark-all-btn" (click)="markAll()">Mark all read</button>
                  }
                </div>

                <!-- Tabs -->
                <div class="notif-tabs">
                  <button class="notif-tab" [class.active]="activeTab() === 'all'" (click)="activeTab.set('all')">All ({{ tabCounts().all }})</button>
                  <button class="notif-tab" [class.active]="activeTab() === 'messages'" (click)="activeTab.set('messages')">Messages ({{ tabCounts().messages }})</button>
                  <button class="notif-tab" [class.active]="activeTab() === 'sessions'" (click)="activeTab.set('sessions')">Sessions ({{ tabCounts().sessions }})</button>
                </div>

                <!-- List -->
                <div class="notif-scroll">
                  @for (n of filteredNotifs(); track n.id) {
                    <div class="notif-row" [class.unread]="!n.isRead" (click)="onNotifClick(n)">
                      <div class="notif-icon" [style.background]="getIconAttr(n.type).bg">
                        <span class="material-icons" [style.color]="getIconAttr(n.type).color">
                          {{ getIconAttr(n.type).icon }}
                        </span>
                      </div>
                      <div class="notif-content">
                        <p class="notif-msg" [class.bold]="!n.isRead">{{ n.message }}</p>
                        <span class="notif-time" [class.bold]="!n.isRead">{{ formatTime(n.createdAt) }}</span>
                      </div>
                      @if (!n.isRead) { <span class="unread-dot"></span> }
                    </div>
                  } @empty {
                    <div class="notif-empty">
                      <span class="material-icons">celebration</span>
                      <p class="empty-title">🎉 You're all caught up!</p>
                      <p class="empty-sub">No new notifications right now.<br/>We'll notify you when something important happens.</p>
                    </div>
                  }
                </div>
                
                <div class="notif-footer">
                  <a routerLink="/notifications" (click)="notifPanelOpen.set(false)">View All Notifications</a>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Avatar Dropdown -->
        <div class="avatar-wrap">
          <button class="avatar-btn" (click)="dropdownOpen.set(!dropdownOpen())" aria-label="User menu">
            <span class="avatar-text">{{ initial() }}</span>
          </button>

          @if (dropdownOpen()) {
            <div class="dropdown">
              <!-- PROFILE HEADER -->
              <div class="dropdown-header">
                <div class="dropdown-avatar">{{ initial() }}</div>
                <div class="dropdown-user">
                  <span class="dropdown-name">{{ authStore.username() || 'User' }}</span>
                  <span class="dropdown-email">{{ authStore.email() || '' }}</span>
                  <div class="badges">
                    <span class="role-badge">{{ authStore.isMentor() ? 'Mentor' : (authStore.isAdmin() ? 'Admin' : 'Learner') }}</span>
                  </div>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <!-- ACCOUNT SECTION -->
              <div class="dropdown-section">
                <div class="section-title">Account</div>
                <a routerLink="/profile" routerLinkActive="active" class="dropdown-item" (click)="close()">
                  <span class="material-icons">person</span>
                  Profile
                </a>
                <a routerLink="/profile/edit" routerLinkActive="active" class="dropdown-item" (click)="close()">
                  <span class="material-icons">edit</span>
                  Edit Profile
                </a>
                <a routerLink="/settings" routerLinkActive="active" class="dropdown-item" (click)="close()">
                  <span class="material-icons">settings</span>
                  Settings
                </a>
              </div>

              <div class="dropdown-divider"></div>

              <!-- ACTIVITY SECTION -->
              <div class="dropdown-section">
                <div class="section-title">Activity</div>
                <a routerLink="/notifications" routerLinkActive="active" class="dropdown-item" (click)="close()">
                  <span class="material-icons">notifications</span>
                  Notifications
                  @if (notifStore.unreadCount() > 0) {
                    <span class="item-badge">{{ notifStore.unreadCount() }}</span>
                  }
                </a>
                <a routerLink="/sessions" routerLinkActive="active" class="dropdown-item" (click)="close()">
                  <span class="material-icons">event</span>
                  My Sessions
                </a>
              </div>

              <div class="dropdown-divider"></div>

              <!-- PREFERENCES SECTION -->
              <div class="dropdown-section">
                <div class="section-title">Preferences</div>
                <button class="dropdown-item" (click)="themeService.toggleTheme()">
                  <span class="material-icons">{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</span>
                  {{ themeService.isDark() ? 'Light Mode' : 'Dark Mode' }} Toggle
                </button>
                <a routerLink="/help" routerLinkActive="active" class="dropdown-item" (click)="close()">
                  <span class="material-icons">help_outline</span>
                  Help / Support
                </a>
              </div>

              <div class="dropdown-divider"></div>

              <!-- LOGOUT SECTION -->
              <div class="dropdown-section">
                <button class="dropdown-item logout" (click)="logout()">
                  <span class="material-icons">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          }
        </div>

      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      height: 64px; background: var(--bg-card);
      border-bottom: 1px solid var(--border-main);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; position: sticky; top: 0; z-index: 200;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }
    .nav-left { display: flex; align-items: center; gap: 8px; }
    .hamburger {
      width: 40px; height: 40px; border-radius: 10px;
      background: none; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); transition: background 0.15s, color 0.15s;
    }
    .hamburger:hover { background: var(--bg-page); color: var(--primary); }
    .hamburger .material-icons { font-size: 22px; }
    .nav-brand { display: flex; align-items: center; gap: 6px; text-decoration: none; }
    .bolt { font-size: 20px; }
    .brand-name { font-size: 18px; font-weight: 800; color: var(--primary); letter-spacing: -0.5px; }
    .nav-actions { display: flex; align-items: center; gap: 6px; }
    .nav-actions-wrap { display: flex; align-items: center; gap: 12px; }
    .icon-btn {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); position: relative;
      background: none; border: none; cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .icon-btn:hover { background: var(--bg-page); color: var(--primary); }
    .icon-btn .material-icons { font-size: 22px; }
    .btn-mentor {
      display: flex; align-items: center; gap: 8px;
      height: 40px; padding: 0 16px; border-radius: 10px;
      background: var(--bg-page); color: var(--primary);
      text-decoration: none; font-size: 13px; font-weight: 700;
      transition: all 0.2s ease; border: 1px solid var(--border-main);
    }
    .btn-mentor:hover {
      background: var(--primary); color: white;
      transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79,70,229,0.2);
    }
    .notif-badge {
      position: absolute; top: 3px; right: 3px;
      background: #ef4444; color: white;
      font-size: 9px; font-weight: 700;
      min-width: 16px; height: 16px; border-radius: 8px; padding: 0 3px;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--bg-card);
    }

    /* -- Notification Panel -- */
    .notif-wrap { position: relative; }
    .notif-panel {
      position: absolute; top: calc(100% + 10px); right: 0;
      width: 360px; background: var(--bg-card);
      border-radius: 16px; border: 1px solid var(--border-main);
      box-shadow: 0 12px 36px rgba(0,0,0,0.13); z-index: 999;
      overflow: hidden; animation: dropIn 0.15s ease;
    }
    .notif-panel-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px 10px; border-bottom: 1px solid var(--border-main);
    }
    .panel-title { font-size: 15px; font-weight: 800; color: var(--text-main); }
    .mark-all-btn {
      font-size: 12px; font-weight: 600; color: var(--primary);
      background: none; border: none; cursor: pointer; padding: 0;
    }
    .mark-all-btn:hover { text-decoration: underline; }
    .notif-tabs {
      display: flex; gap: 0; padding: 8px 12px;
      border-bottom: 1px solid var(--border-main);
    }
    .notif-tab {
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
      background: none; border: none; cursor: pointer; color: var(--text-muted);
      transition: all 0.15s;
    }
    .notif-tab.active { background: rgba(99,102,241,0.1); color: var(--primary); }
    .notif-scroll { max-height: 320px; overflow-y: auto; }
    .notif-scroll::-webkit-scrollbar { width: 4px; }
    .notif-scroll::-webkit-scrollbar-thumb { background: var(--border-main); border-radius: 4px; }
    .notif-row {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 14px; cursor: pointer;
      border-bottom: 1px solid var(--border-main);
      transition: background 0.12s;
    }
    .notif-row:last-child { border-bottom: none; }
    .notif-row:hover { background: var(--bg-page); }
    .notif-row.unread { background: rgba(99,102,241,0.04); }
    .notif-icon {
      width: 34px; height: 34px; border-radius: 10px;
      background: var(--bg-page); display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .notif-icon .material-icons { font-size: 18px; color: var(--text-muted); }
    .notif-icon.unread-icon { background: rgba(99,102,241,0.12); }
    .notif-icon.unread-icon .material-icons { color: var(--primary); }
    .notif-content { flex: 1; min-width: 0; }
    .notif-msg {
      margin: 0 0 3px; font-size: 13px; color: var(--text-muted);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .notif-msg.bold { font-weight: 600; color: var(--text-main); }
    .notif-time { font-size: 11px; color: var(--text-muted); }
    .notif-time.bold { font-weight: 600; color: var(--primary); }
    .unread-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--primary); flex-shrink: 0; margin-top: 4px;
    }
    .notif-empty {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 30px 20px; color: var(--text-muted); text-align: center;
    }
    .notif-empty .material-icons { font-size: 32px; color: #f59e0b; margin-bottom: 4px; }
    .empty-title { color: #111827; font-size: 14px; font-weight: 700; margin: 0; }
    .empty-sub { color: #6b7280; font-size: 12px; margin: 0; line-height: 1.5; }
    .notif-footer {
      padding: 12px; text-align: center; border-top: 1px solid var(--border-main);
      background: #f9fafb;
    }
    .notif-footer a {
      color: var(--primary); font-size: 13px; font-weight: 600;
      text-decoration: none; transition: 0.15s; cursor: pointer;
    }
    .notif-footer a:hover { text-decoration: underline; color: #4338ca; }

    /* -- Avatar Dropdown -- */
    .avatar-wrap { position: relative; }
    .avatar-btn {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, var(--primary), #7c3aed);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.15s, transform 0.1s;
    }
    .avatar-text { color: white; font-size: 14px; font-weight: 700; }
    .dropdown {
      position: absolute; top: calc(100% + 10px); right: 0;
      width: 260px; background: var(--bg-card);
      border-radius: 16px; border: 1px solid var(--border-main);
      box-shadow: 0 12px 36px rgba(0,0,0,0.15); overflow: hidden;
      z-index: 999; animation: dropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      padding: 6px 0;
    }
    .dropdown-header {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px;
    }
    .dropdown-avatar {
      width: 40px; height: 40px; border-radius: 12px;
      background: linear-gradient(135deg, var(--primary), #7c3aed);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 16px; font-weight: 700; flex-shrink: 0;
    }
    .dropdown-user { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .dropdown-name { display: block; font-weight: 600; font-size: 14px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dropdown-email { display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .badges { display: flex; gap: 6px; align-items: center; margin-top: 2px; }
    .role-badge {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      background: rgba(99,102,241,0.1); color: var(--primary);
      padding: 2px 6px; border-radius: 6px; display: inline-block;
    }
    .dropdown-section { padding: 4px 6px; }
    .section-title {
      font-size: 11px; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; padding: 4px 10px 8px; letter-spacing: 0.5px;
    }
    .dropdown-divider { height: 1px; background: var(--border-main); margin: 2px 16px; }
    .dropdown-item {
      display: flex; align-items: center; gap: 10px; padding: 8px 10px;
      font-size: 13px; font-weight: 500; color: var(--text-main);
      text-decoration: none; background: none; border: none; text-align: left;
      width: 100%; cursor: pointer; transition: all 0.15s ease;
      border-radius: 8px;
    }
    .dropdown-item:hover { background: var(--bg-page); color: var(--primary); transform: translateX(2px); }
    .dropdown-item.active { background: rgba(99,102,241,0.08); color: var(--primary); font-weight: 600; }
    .dropdown-item.active .material-icons { color: var(--primary); }
    .dropdown-item .material-icons { color: var(--text-muted); font-size: 18px; transition: color 0.15s ease; }
    .dropdown-item:hover .material-icons { color: var(--primary); }
    .item-badge {
      margin-left: auto; background: #ef4444; color: white;
      font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 10px;
    }
    .dropdown-item.logout { color: #ef4444; margin-top: 2px; }
    .dropdown-item.logout .material-icons { color: #ef4444; }
    .dropdown-item.logout:hover { background: #fee2e2; color: #dc2626; transform: translateX(2px); }
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class NavbarComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();

  readonly authStore = inject(AuthStore);
  readonly notifStore = inject(NotificationStore);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  readonly dropdownOpen = signal(false);
  readonly notifPanelOpen = signal(false);
  readonly activeTab = signal<NotifCategory>('all');

  readonly tabs = [
    { key: 'all' as NotifCategory,      label: 'All' },
    { key: 'messages' as NotifCategory, label: 'Messages' },
    { key: 'sessions' as NotifCategory, label: 'Sessions' }
  ];

  filteredNotifs = computed(() => {
    const list = this.notifStore.notifications();
    let res = list;
    const tab = this.activeTab();
    if (tab === 'sessions') res = list.filter(n => n.type.includes('SESSION') || n.type.includes('MENTOR'));
    else if (tab === 'messages') res = list.filter(n => n.type.includes('MESSAGE') || n.type.includes('REVIEW'));
    
    // Only show latest 5 in the dropdown widget
    return res.slice(0, 5);
  });

  tabCounts = computed(() => {
    const list = this.notifStore.notifications();
    return {
      all: list.length,
      sessions: list.filter(n => n.type.includes('SESSION') || n.type.includes('MENTOR')).length,
      messages: list.filter(n => n.type.includes('MESSAGE') || n.type.includes('REVIEW')).length
    };
  });

  ngOnInit(): void { 
    this.notifStore.loadAll();
    this.notifStore.startPolling(); 
  }

  initial(): string {
    const u = this.authStore.username();
    return u ? u[0].toUpperCase() : '?';
  }

  getIconAttr(type: string): { icon: string, color: string, bg: string } {
    const up = type.toUpperCase();
    if (up.includes('SESSION') || up.includes('MENTOR')) return { icon: 'event', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' }; 
    if (up.includes('MESSAGE') || up.includes('REVIEW')) return { icon: 'chat_bubble_outline', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' }; 
    if (up.includes('ACTION') || up.includes('ALERT')) return { icon: 'warning', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' }; 
    return { icon: 'notifications', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }; 
  }

  close(): void { this.dropdownOpen.set(false); }

  toggleNotifPanel(): void {
    this.notifPanelOpen.update(v => !v);
    this.dropdownOpen.set(false);
  }

  markAll(): void { 
    this.notifStore.unread().forEach(n => this.notifStore.markRead(n.id));
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
    if (!iso) return 'just now';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return hrs + 'h ago';
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
    if (!target.closest('.avatar-wrap'))  this.dropdownOpen.set(false);
    if (!target.closest('.notif-wrap'))   this.notifPanelOpen.set(false);
  }
}
