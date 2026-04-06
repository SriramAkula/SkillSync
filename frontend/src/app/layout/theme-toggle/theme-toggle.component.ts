import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="theme-toggle-btn" (click)="themeService.toggleTheme()" [title]="themeService.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
      <div class="icon-container">
        @if (themeService.isDark()) {
          <span class="material-icons sun-icon">light_mode</span>
        } @else {
          <span class="material-icons moon-icon">dark_mode</span>
        }
      </div>
    </button>
  `,
  styles: [`
    .theme-toggle-btn {
      width: 44px;
      height: 44px;
      border-radius: 11px;
      border: 1px solid;
      background: var(--bg-card);
      color: var(--text-main);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      padding: 0;
      box-shadow: var(--card-shadow);

      /* Light mode styling */
      @media (prefers-color-scheme: light) {
        border-color: #e2e8f0;
        background: #f8fafc;
        color: #64748b;

        &:hover {
          transform: scale(1.05);
          border-color: var(--primary, #2563eb);
          color: var(--primary, #2563eb);
          background: #f1f5f9;
        }

        &:active {
          transform: scale(0.95);
        }
      }

      /* Dark mode styling - IMPROVED VISIBILITY */
      @media (prefers-color-scheme: dark) {
        border-color: #475569;
        background: #1e293b;
        color: #fbbf24;

        &:hover {
          transform: scale(1.05);
          border-color: #fbbf24;
          color: #fcd34d;
          background: #334155;
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }

    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      animation: slide-up 0.3s ease-out;
    }

    .material-icons {
      font-size: 22px;
      font-weight: bold;
    }

    @keyframes slide-up {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);
}
