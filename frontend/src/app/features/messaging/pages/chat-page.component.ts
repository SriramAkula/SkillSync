/**
 * Chat Page Component
 * Top-level page for messaging feature
 * Wraps the chat container and handles navigation
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatContainerComponent } from '../components/chat-container/chat-container.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, ChatContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-page">
      <app-chat-container></app-chat-container>
    </div>
  `,
  styles: [`
    .chat-page {
      display: flex;
      width: 100%;
      height: 100vh;
      background-color: #1a1a2e;
      color: #ffffff;
    }

    @media (max-width: 768px) {
      .chat-page {
        height: calc(100vh - 56px);
      }
    }
  `]
})
export class ChatPageComponent {}
