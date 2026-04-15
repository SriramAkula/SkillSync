import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { MessagingService } from './core/services/messaging.service';
import { ChatDrawerComponent } from './shared/components/chat-drawer/chat-drawer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ChatDrawerComponent, ToastComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private readonly themeService = inject(ThemeService);
  protected readonly messagingService = inject(MessagingService);

  chatConfig$ = this.messagingService.chatConfig$;

  closeChat(): void {
    this.messagingService.closeChat();
  }
}
