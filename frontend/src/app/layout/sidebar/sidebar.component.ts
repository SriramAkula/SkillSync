import { Component, inject, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';

interface NavItem { 
  label: string; 
  icon: string; 
  route: string; 
  roles?: string[]; 
  excludeRoles?: string[];
  exact?: boolean;
}

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
    // --- Learner / Mentor Discovery ---
    { label: 'Mentors', icon: 'people', route: '/mentors', excludeRoles: ['ROLE_ADMIN'] },
    { label: 'Skills', icon: 'collections_bookmark', route: '/skills', excludeRoles: ['ROLE_ADMIN'] },
    { label: 'Groups', icon: 'groups', route: '/groups', excludeRoles: ['ROLE_ADMIN'] },
    
    // --- Personal / Interaction ---
    { label: 'My Sessions', icon: 'event_note', route: '/sessions', roles: ['ROLE_LEARNER'] },
    { label: 'Notifications', icon: 'notifications_none', route: '/notifications' },
    { label: 'Messages', icon: 'chat_bubble_outline', route: '/messages', excludeRoles: ['ROLE_ADMIN'] },
    { label: 'Profile', icon: 'person_outline', route: '/profile', excludeRoles: ['ROLE_ADMIN'] },
    
    // --- Mentor Specific ---
    { label: 'Dashboard', icon: 'dashboard_customize', route: '/mentor-dashboard', roles: ['ROLE_MENTOR'] },
    
    // --- Administrative ---
    { label: 'Approve Mentors', icon: 'verified_user', route: '/admin', roles: ['ROLE_ADMIN'], exact: true },
    { label: 'User Management', icon: 'manage_accounts', route: '/admin/users', roles: ['ROLE_ADMIN'] },
    { label: 'Skill Management', icon: 'settings_suggest', route: '/admin/skills', roles: ['ROLE_ADMIN'] },
  ];

  visibleItems() {
    return this.allItems.filter(i => {
      const userRoles = this.authStore.roles();
      
      // If item has excludeRoles, check if user has any of them
      if (i.excludeRoles && i.excludeRoles.some(r => userRoles.includes(r))) {
        return false;
      }
      
      // Standard role check
      return !i.roles || i.roles.some(r => userRoles.includes(r));
    });
  }

  logout() {
    this.authStore.logout();
  }
}
