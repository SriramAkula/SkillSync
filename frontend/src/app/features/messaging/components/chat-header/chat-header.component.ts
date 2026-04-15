/**
 * Chat Header Component
 * Displays information about current conversation
 * Shows contact name/group name, online status, member count
 * Includes action buttons (info, call, settings)
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStore } from '../../services/chat.store';
import type { Conversation, DirectConversation, GroupConversation } from '../../models';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (conversation()) {
      <div class="chat-header">
        <!-- Left: Avatar + Info -->
        <div class="header-left">
          <div class="avatar" [ngStyle]="getAvatarStyle()">
            {{ getAvatarInitials() }}
          </div>

          <div class="info">
            <h2 class="name">{{ getDisplayName() }}</h2>
            <p class="subtitle" [class.offline]="getSubtitle() === 'Offline'">
              @if (isOnline()) {
                <span class="status-dot"></span>
              }
              {{ getSubtitle() }}
            </p>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="header-actions">
          <button class="action-btn" title="Call" (click)="onCall()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </button>
          <button class="action-btn" title="Conversation Details" (click)="onInfo()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </button>
          <button class="action-btn" title="More options" (click)="onMore()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </button>
        </div>
      </div>
    }
  `,
  styleUrls: ['./chat-header.component.scss']
})
export class ChatHeaderComponent {
  @Input() conversation: () => Conversation | null = () => null;
  @Output() infoClicked = new EventEmitter<void>();
  @Output() callClicked = new EventEmitter<void>();
  @Output() moreClicked = new EventEmitter<void>();

  private chatStore = inject(ChatStore);

  getDisplayName(): string {
    const conv = this.conversation();
    if (!conv) return '';
    return this.chatStore.getConversationDisplayName(conv);
  }

  getSubtitle(): string {
    const conv = this.conversation();
    if (!conv) return '';

    if (conv.type === 'direct') {
      const direct = conv as DirectConversation;
      return this.chatStore.isUserOnline(direct.participantId)
        ? 'Active now'
        : 'Offline';
    }

    const group = conv as GroupConversation;
    return `${group.memberCount} members`;
  }

  isOnline(): boolean {
    const conv = this.conversation();
    if (conv?.type === 'direct') {
      const direct = conv as DirectConversation;
      return this.chatStore.isUserOnline(direct.participantId);
    }
    return false;
  }

  getAvatarInitials(): string {
    const name = this.getDisplayName();
    return name
      .split(' ')
      .map((n: string) => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  getAvatarStyle(): Record<string, string> {
    const conv = this.conversation();
    if (!conv) return {};

    const colors = [
      'linear-gradient(135deg, #7c5cff, #5a4fb8)',
      'linear-gradient(135deg, #00d4ff, #0099cc)',
      'linear-gradient(135deg, #ff6b6b, #cc5555)',
      'linear-gradient(135deg, #ffa500, #cc8400)',
    ];
    const hash = conv.id
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      background: colors[hash % colors.length],
    };
  }

  onCall(): void {
    this.callClicked.emit();
  }

  onInfo(): void {
    this.infoClicked.emit();
  }

  onMore(): void {
    this.moreClicked.emit();
  }
}
