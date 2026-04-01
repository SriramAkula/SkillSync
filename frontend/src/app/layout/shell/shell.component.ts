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
      <app-navbar (menuToggle)="sidebarOpen.set(!sidebarOpen())" />

      <div class="body">
        <!-- Sidebar -->
        <aside class="sidebar-wrap" [class.open]="sidebarOpen()">
          <app-sidebar (navClick)="sidebarOpen.set(false)" />
        </aside>

        <!-- Mobile overlay -->
        @if (sidebarOpen()) {
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

    /* Sidebar — always visible on desktop */
    .sidebar-wrap {
      width: 240px; flex-shrink: 0;
      background: white; border-right: 1px solid #e5e7eb;
      overflow-y: auto; z-index: 50;
      transition: transform 0.25s ease;
    }

    /* Main content */
    .main-content {
      flex: 1; overflow-y: auto;
      padding: 24px; background: #f9fafb;
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
        transform: translateX(-100%);
        box-shadow: 4px 0 20px rgba(0,0,0,0.1);
      }
      .sidebar-wrap.open { transform: translateX(0); }
      .overlay { display: block; top: 64px; }
      .main-content { padding: 16px; }
    }

    @media (max-width: 480px) {
      .main-content { padding: 12px; }
    }
  `]
})
export class ShellComponent {
  readonly sidebarOpen = signal(false);
}
