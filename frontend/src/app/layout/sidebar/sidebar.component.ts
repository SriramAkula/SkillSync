import { Component, inject, Output, EventEmitter, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';

interface NavItem { label: string; icon: string; route: string; roles?: string[]; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Output() navClick = new EventEmitter<void>();
  private readonly authStore = inject(AuthStore);

  private readonly allItems: NavItem[] = [
    { label: 'Mentors', icon: 'people', route: '/mentors' },
    { label: 'Skills', icon: 'collections_bookmark', route: '/skills' },
    { label: 'My Sessions', icon: 'event_note', route: '/sessions', roles: ['ROLE_LEARNER'] },
    { label: 'Groups', icon: 'groups', route: '/groups' },
    { label: 'Notifications', icon: 'notifications_none', route: '/notifications' },
    { label: 'Profile', icon: 'person_outline', route: '/profile' },
    { label: 'Dashboard', icon: 'dashboard_customize', route: '/mentor-dashboard', roles: ['ROLE_MENTOR'] },
    { label: 'Admin', icon: 'admin_panel_settings', route: '/admin', roles: ['ROLE_ADMIN'] },
  ];

  visibleItems() {
    return this.allItems.filter(i =>
      !i.roles || i.roles.some(r => this.authStore.roles().includes(r))
    );
  }

  logout() {
    this.authStore.logout();
  }
}
