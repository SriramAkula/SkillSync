import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';

interface NavItem { label: string; icon: string; route: string; roles?: string[]; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <nav class="nav-list">
        @for (item of visibleItems(); track item.route) {
          <a class="nav-item" [routerLink]="item.route" routerLinkActive="active"
             (click)="navClick.emit()">
            <span class="material-icons nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar { height: 100%; padding: 12px 10px; }
    .nav-list { display: flex; flex-direction: column; gap: 2px; }

    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px;
      text-decoration: none; color: #6b7280;
      font-size: 14px; font-weight: 500;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .nav-item:hover { background: #f3f4f6; color: #111827; }
    .nav-item:hover .nav-icon { color: #4f46e5; }

    .nav-item.active {
      background: #eef2ff; color: #4f46e5; font-weight: 600;
    }
    .nav-item.active .nav-icon { color: #4f46e5; }

    .nav-icon { font-size: 20px; color: #9ca3af; transition: color 0.15s; flex-shrink: 0; }
  `]
})
export class SidebarComponent {
  @Output() navClick = new EventEmitter<void>();
  private readonly authStore = inject(AuthStore);

  private readonly allItems: NavItem[] = [
    { label: 'Mentors',       icon: 'people',               route: '/mentors' },
    { label: 'Skills',        icon: 'auto_stories',         route: '/skills' },
    { label: 'My Sessions',   icon: 'event',                route: '/sessions',         roles: ['ROLE_LEARNER'] },
    { label: 'Groups',        icon: 'group_work',           route: '/groups' },
    { label: 'Notifications', icon: 'notifications',        route: '/notifications' },
    { label: 'Profile',       icon: 'person',               route: '/profile' },
    { label: 'Dashboard',     icon: 'dashboard',            route: '/mentor-dashboard', roles: ['ROLE_MENTOR'] },
    { label: 'Admin',         icon: 'admin_panel_settings', route: '/admin',            roles: ['ROLE_ADMIN'] },
  ];

  visibleItems() {
    return this.allItems.filter(i =>
      !i.roles || i.roles.some(r => this.authStore.roles().includes(r))
    );
  }
}
