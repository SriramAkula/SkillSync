import { Component, inject, Output, EventEmitter, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';

interface NavItem { label: string; icon: string; route: string; roles?: string[]; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="h-full flex flex-col py-6 px-4">
      
      <!-- Brand Logo -->
      <div class="flex items-center gap-3 px-2 mb-10 overflow-hidden">
        <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary-200">
          <span class="material-icons text-white">auto_awesome</span>
        </div>
        @if (!isCollapsed) {
          <span class="text-xl font-bold tracking-tight text-slate-800 transition-opacity duration-300">SkillSync</span>
        }
      </div>

      <!-- Nav Items -->
      <nav class="flex-1 space-y-1">
        @for (item of visibleItems(); track item.route) {
          <a class="group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-slate-100 hover:text-primary-600 active:scale-[0.98]"
             [routerLink]="item.route" routerLinkActive="bg-primary-50 text-primary-600 ring-1 ring-primary-100/50"
             (click)="navClick.emit()">
            <span class="material-icons-outlined shrink-0 group-hover:scale-110 transition-transform">{{ item.icon }}</span>
            @if (!isCollapsed) {
              <span class="font-medium text-sm tracking-wide">{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <!-- Logout (Optional in Sidebar) -->
      <button 
        (click)="logout()"
        class="mt-auto group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98]">
        <span class="material-icons-outlined shrink-0 group-hover:rotate-12 transition-transform text-slate-400 group-hover:text-red-500">logout</span>
        @if (!isCollapsed) {
          <span class="font-medium text-sm tracking-wide text-slate-500 group-hover:text-red-600">Logout</span>
        }
      </button>
    </div>
  `
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
