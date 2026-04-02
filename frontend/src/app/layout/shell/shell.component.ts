import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, SidebarComponent],
  template: `
    <div class="shell">
      <app-navbar (menuToggle)="toggleSidebar()" />

      <div class="body">
        <!-- Sidebar -->
        <aside class="sidebar-wrap" [class.open]="sidebarOpen()" [class.closed]="!sidebarOpen()">
          <app-sidebar (navClick)="closeOnMobile()" />
        </aside>

        <!-- Mobile overlay -->
        @if (sidebarOpen() && isMobile()) {
          <div class="overlay" (click)="sidebarOpen.set(false)"></div>
        }

        <!-- Main content -->
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

    .body { display: flex; flex: 1; overflow: hidden; }

    /* Sidebar — desktop */
    .sidebar-wrap {
      width: 240px; flex-shrink: 0;
      background: var(--card-bg); border-right: 1px solid var(--border-color);
      overflow-y: auto; z-index: 50;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
      margin-left: 0;
    }
    
    /* Desktop Closed state */
    .sidebar-wrap.closed { margin-left: -240px; }

    /* Main content */
    .main-content {
      flex: 1; overflow-y: auto;
      padding: 24px; background: var(--bg-color);
      color: var(--text-primary);
    }

    /* Mobile overlay */
    .overlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 49;
    }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      .sidebar-wrap {
        position: fixed; top: 64px; left: 0; bottom: 0;
        margin-left: -240px; /* Hidden by default on mobile */
        box-shadow: 4px 0 20px rgba(0,0,0,0.1);
      }
      /* Mobile Open state */
      .sidebar-wrap.open { margin-left: 0; }
      .overlay { display: block; top: 64px; }
      .main-content { padding: 16px; }
    }

    @media (max-width: 480px) {
      .main-content { padding: 12px; }
    }
  `]
})
export class ShellComponent {
  readonly isMobile = signal(window.innerWidth <= 768);
  // On desktop, it's open by default. On mobile, it's closed by default.
  readonly sidebarOpen = signal(!this.isMobile());

  constructor() {
    window.addEventListener('resize', () => {
      const mobile = window.innerWidth <= 768;
      if (mobile !== this.isMobile()) {
        this.isMobile.set(mobile);
        this.sidebarOpen.set(!mobile);
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  closeOnMobile(): void {
    if (this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  }
}

