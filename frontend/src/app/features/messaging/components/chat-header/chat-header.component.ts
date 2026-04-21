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
        <div class="header-left">
          <div class="avatar-card">
            {{ getAvatarInitials() }}
          </div>
          <div class="info">
            <h2 class="name">{{ getDisplayName() }}</h2>
          </div>
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
