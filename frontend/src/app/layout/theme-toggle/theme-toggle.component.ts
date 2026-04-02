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
      border-radius: 50%;
      border: 1px solid var(--border-main);
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

      &:hover {
        transform: scale(1.1);
        border-color: var(--primary);
        color: var(--primary);
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
