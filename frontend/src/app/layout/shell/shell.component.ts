import { Component, signal, inject, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, NavbarComponent, SidebarComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-500">
      
      <!-- Desktop Sidebar -->
      <aside 
        class="hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-500 ease-in-out overflow-hidden"
        [class.w-72]="!isCollapsed()"
        [class.w-20]="isCollapsed()">
        <app-sidebar [isCollapsed]="isCollapsed()" />
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <!-- Navbar -->
        <app-navbar (toggleSidebar)="toggleSidebar()" [isCollapsed]="isCollapsed()" />

        <!-- Router Content -->
        <main class="flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-10 pb-24 lg:pb-10">
          <div class="max-w-7xl mx-auto">
            <router-outlet />
          </div>
        </main>

        <!-- Mobile Bottom Nav -->
        <nav class="lg:hidden fixed bottom-0 left-0 right-0 glass-effect border-t border-white/20 px-6 py-3 z-50 flex justify-between items-center rounded-t-3xl shadow-2xl">
          <a routerLink="/mentors" routerLinkActive="text-primary-600" class="flex flex-col items-center gap-1 transition-colors hover:text-primary-500 text-slate-400">
            <span class="material-icons-outlined">search</span>
            <span class="text-[10px] font-medium uppercase tracking-wider">Explore</span>
          </a>
          <a routerLink="/sessions" routerLinkActive="text-primary-600" class="flex flex-col items-center gap-1 transition-colors hover:text-primary-500 text-slate-400">
            <span class="material-icons-outlined">calendar_today</span>
            <span class="text-[10px] font-medium uppercase tracking-wider">Sessions</span>
          </a>
          <div class="relative -top-6">
            <a routerLink="/groups" routerLinkActive="bg-primary-700 shadow-primary-200" class="flex items-center justify-center w-14 h-14 bg-primary-600 text-white rounded-2xl shadow-xl shadow-primary-100 transition-transform active:scale-95">
              <span class="material-icons">group</span>
            </a>
          </div>
          <a routerLink="/notifications" routerLinkActive="text-primary-600" class="flex flex-col items-center gap-1 transition-colors hover:text-primary-500 text-slate-400">
            <span class="material-icons-outlined">notifications</span>
            <span class="text-[10px] font-medium uppercase tracking-wider">Alerts</span>
          </a>
          <a routerLink="/profile" routerLinkActive="text-primary-600" class="flex flex-col items-center gap-1 transition-colors hover:text-primary-500 text-slate-400">
            <span class="material-icons-outlined">person</span>
            <span class="text-[10px] font-medium uppercase tracking-wider">Profile</span>
          </a>
        </nav>

      </div>

      <!-- Mobile Sidebar Overlay (optional drawer) -->
      @if (mobileMenuOpen()) {
        <div class="lg:hidden fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm" (click)="mobileMenuOpen.set(false)">
          <aside class="w-72 h-full bg-white shadow-2xl animate-slide-in" (click)="$event.stopPropagation()">
             <app-sidebar (navClick)="mobileMenuOpen.set(false)" />
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    .animate-slide-in {
      animation: slide-in 0.3s cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class ShellComponent {
  readonly isCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);
  private lastWidth = window.innerWidth;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (window.innerWidth >= 1024 && this.lastWidth < 1024) {
      this.mobileMenuOpen.set(false);
    }
    this.lastWidth = window.innerWidth;
  }

  toggleSidebar(): void {
    if (window.innerWidth >= 1024) {
      this.isCollapsed.set(!this.isCollapsed());
    } else {
      this.mobileMenuOpen.set(!this.mobileMenuOpen());
    }
  }
}
