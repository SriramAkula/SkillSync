import { Component, inject, OnInit, Output, EventEmitter, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { NotificationStore } from '../../core/auth/notification.store';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

        <!-- Notification Bell -->
        <div class="nav-actions-wrap">
          @if (authStore.canApplyToBeMentor()) {
            <a routerLink="/mentors/apply" class="btn-mentor">
              <span class="material-icons">school</span>
              <span class="btn-text">Become a Mentor</span>
            </a>
          }

          <a routerLink="/notifications" class="icon-btn" aria-label="Notifications">
            <span class="material-icons">notifications</span>
            @if (notifStore.unreadCount() > 0) {
              <span class="notif-badge">
                {{ notifStore.unreadCount() > 9 ? '9+' : notifStore.unreadCount() }}
              </span>
            }
          </a>

          <!-- Dark / Light Mode Toggle -->
          <button class="icon-btn theme-toggle" (click)="themeService.toggle()"
                  [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
                  [title]="themeService.isDark() ? 'Light mode' : 'Dark mode'">
            <span class="material-icons">{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</span>
          </button>
        </div>

        <!-- Avatar + Custom Dropdown -->
        <div class="avatar-wrap">
          <button class="avatar-btn" (click)="dropdownOpen.set(!dropdownOpen())" aria-label="User menu">
            <span class="avatar-text">{{ initial() }}</span>
          </button>

          @if (dropdownOpen()) {
            <div class="dropdown">
              <!-- User Info -->
              <div class="dropdown-header">
                <div class="dropdown-avatar">{{ initial() }}</div>
                <div class="dropdown-user">
                  <span class="dropdown-name">{{ authStore.username() || 'User' }}</span>
                  <span class="dropdown-email">{{ authStore.email() || '' }}</span>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <a routerLink="/profile" class="dropdown-item" (click)="close()">
                <span class="material-icons">person</span>
                Profile
              </a>

              <a routerLink="/notifications" class="dropdown-item" (click)="close()">
                <span class="material-icons">notifications</span>
                Notifications
                @if (notifStore.unreadCount() > 0) {
                  <span class="item-badge">{{ notifStore.unreadCount() }}</span>
                }
              </a>


              @if (authStore.isMentor()) {
                <a routerLink="/mentor-dashboard" class="dropdown-item" (click)="close()">
                  <span class="material-icons">dashboard</span>
                  Mentor Dashboard
                </a>
              }

              @if (authStore.isAdmin()) {
                <a routerLink="/admin" class="dropdown-item" (click)="close()">
                  <span class="material-icons">admin_panel_settings</span>
                  Admin Panel
                </a>
              }

              <div class="dropdown-divider"></div>

              <button class="dropdown-item logout" (click)="logout()">
                <span class="material-icons">logout</span>
                Sign Out
              </button>
            </div>
          }
        </div>

      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      height: 64px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      position: sticky;
      top: 0;
      z-index: 200;
      box-shadow: var(--shadow-sm);
      transition: background-color 0.25s ease, border-color 0.25s ease;
    }

    /* Left */
    .nav-left { display: flex; align-items: center; gap: 8px; }

    .hamburger {
      width: 40px; height: 40px; border-radius: 10px;
      background: none; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary); transition: background 0.15s, color 0.15s;
    }
    .hamburger:hover { background: var(--surface-alt); color: var(--primary); }
    .hamburger .material-icons { font-size: 22px; }

    .nav-brand { display: flex; align-items: center; gap: 6px; text-decoration: none; }
    .bolt { font-size: 20px; }
    .brand-name { font-size: 18px; font-weight: 800; color: var(--primary); letter-spacing: -0.5px; }
    @media (max-width: 360px) { .brand-name { display: none; } }

    /* Right */
    .nav-actions { display: flex; align-items: center; gap: 6px; }

    .icon-btn {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary); text-decoration: none; position: relative;
      transition: background 0.15s, color 0.15s;
      background: none; border: none; cursor: pointer;
    }
    .icon-btn:hover { background: var(--surface-alt); color: var(--primary); }
    .icon-btn .material-icons { font-size: 22px; }
    .theme-toggle .material-icons { font-size: 20px; }

    .nav-actions-wrap { display: flex; align-items: center; gap: 8px; }

    .btn-mentor {
      display: flex; align-items: center; gap: 8px;
      height: 40px; padding: 0 16px; border-radius: 10px;
      background: #eef2ff; color: #4f46e5;
      text-decoration: none; font-size: 13px; font-weight: 700;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid #e0e7ff;
    }
    .btn-mentor:hover {
      background: #4f46e5; color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(79,70,229,0.2);
    }
    .btn-mentor .material-icons { font-size: 18px; }
    @media (max-width: 640px) { .btn-mentor .btn-text { display: none; } .btn-mentor { padding: 0 10px; } }

    .notif-badge {
      position: absolute; top: 3px; right: 3px;
      background: #ef4444; color: white;
      font-size: 9px; font-weight: 700;
      min-width: 16px; height: 16px; border-radius: 8px; padding: 0 3px;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid white;
    }

    /* Avatar */
    .avatar-wrap { position: relative; }

    .avatar-btn {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.15s, transform 0.1s;
    }
    .avatar-btn:hover { opacity: 0.9; transform: scale(1.05); }
    .avatar-text { color: white; font-size: 14px; font-weight: 700; }

    /* Dropdown */
    .dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 240px;
      background: var(--surface);
      border-radius: 16px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      z-index: 999;
      animation: dropIn 0.15s ease;
    }

    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: var(--surface-alt);
    }
    .dropdown-avatar {
      width: 38px; height: 38px; border-radius: 10px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: white; font-weight: 700; font-size: 15px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .dropdown-user { min-width: 0; }
    .dropdown-name {
      display: block; font-weight: 600; font-size: 14px; color: var(--text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dropdown-email {
      display: block; font-size: 12px; color: var(--text-secondary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text);
      text-decoration: none;
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: background 0.12s, color 0.12s;
    }
    .dropdown-item:hover { background: var(--surface-alt); color: var(--primary); }
    .dropdown-item:hover .material-icons { color: var(--primary); }
    .dropdown-item .material-icons { font-size: 18px; color: var(--text-muted); transition: color 0.12s; }

    .item-badge {
      margin-left: auto;
      background: #ef4444; color: white;
      font-size: 10px; font-weight: 700;
      min-width: 18px; height: 18px; border-radius: 9px; padding: 0 4px;
      display: flex; align-items: center; justify-content: center;
    }

    .dropdown-item.logout { color: #dc2626; }
    .dropdown-item.logout .material-icons { color: #dc2626; }
    .dropdown-item.logout:hover { background: #fef2f2; color: #dc2626; }
  `]
})
export class NavbarComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();

  readonly authStore = inject(AuthStore);
  readonly notifStore = inject(NotificationStore);
  readonly themeService = inject(ThemeService);
  readonly dropdownOpen = signal(false);

  ngOnInit(): void { this.notifStore.startPolling(); }

  initial(): string {
    const u = this.authStore.username();
    return u ? u[0].toUpperCase() : '?';
  }

  close(): void { this.dropdownOpen.set(false); }

  logout(): void {
    this.dropdownOpen.set(false);
    this.notifStore.stopPolling();
    this.authStore.logout();
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.avatar-wrap')) {
      this.dropdownOpen.set(false);
    }
  }
}
