import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { ToastComponent } from './shared/components/toast/toast.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private readonly themeService = inject(ThemeService);
}
