/**
 * Conversation Item Component
 * Displays a single conversation in the conversation list
 * Supports both direct messages and group chats
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatStore } from '../../services/chat.store';
import { ConversationService } from '../../services/conversation.service';
import type { Conversation, DirectConversation } from '../../models';

@Component({
  selector: 'app-conversation-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="conversation-item"
      [class.selected]="isSelected()"
      (click)="onSelect()"
      (keydown.enter)="onSelect()"
      role="button"
      tabindex="0"
    >
      <!-- Avatar -->
      <div class="avatar-wrapper">
        <div class="avatar" [ngStyle]="getAvatarStyle()">
          {{ getAvatarInitials() }}
        </div>
        @if (isOnline()) {
          <div class="online-indicator"></div>
        }
      </div>

      <!-- Content -->
      <div class="content">
        <!-- Header: Name + Timestamp -->
        <div class="header">
          <h4 class="name">{{ displayName() }}</h4>
          <span class="timestamp">{{ formatTimestamp() }}</span>
        </div>

        <!-- Preview: Last message + Unread badge -->
        <div class="preview-row">
          <p class="preview">{{ lastMessagePreview() }}</p>
          @if (unreadBadge() && unreadBadge()! > 0) {
            <div class="unread-badge">{{ unreadBadge() }}</div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./conversation-item.component.scss']
})
export class ConversationItemComponent {
  @Input() conversation!: Conversation;
  @Input() isSelected: () => boolean = () => false;
  @Output() clicked = new EventEmitter<Conversation>();

  private chatStore = inject(ChatStore);
  private conversationService = inject(ConversationService);

  // Computed properties
  displayName = computed(() =>
    this.chatStore.getConversationDisplayName(this.conversation)
  );

  subtitle = computed(() =>
    this.chatStore.getConversationSubtitle(this.conversation)
  );

  unreadBadge = computed(() => this.conversation.unreadCount || null);

  isOnline = computed(() => {
    if (this.conversation.type === 'direct') {
      const direct = this.conversation as DirectConversation;
      return this.chatStore.isUserOnline(direct.participantId);
    }
    return false;
  });

  lastMessagePreview = computed(() => {
    if (!this.conversation.lastMessage) {
      return this.subtitle();
    }
    const msg = this.conversation.lastMessage;
    const direct = this.conversation as DirectConversation;
    const sender = msg.senderId === direct.userId ? 'You' : msg.senderName || 'User';
    return `${sender}: ${msg.content.substring(0, 40)}${msg.content.length > 40 ? '...' : ''}`;
  });

  // Helper methods
  getAvatarInitials(): string {
    const name = this.displayName();
    return name
      .split(' ')
      .map((n: string) => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  getAvatarStyle(): Record<string, string> {
    const colors = [
      'linear-gradient(135deg, #7c5cff, #5a4fb8)',
      'linear-gradient(135deg, #00d4ff, #0099cc)',
      'linear-gradient(135deg, #ff6b6b, #cc5555)',
      'linear-gradient(135deg, #ffa500, #cc8400)',
    ];
    // Deterministic color based on conversation ID
    const hash = this.conversation.id
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      background: colors[hash % colors.length],
    };
  }

  formatTimestamp(): string {
    const date = new Date(this.conversation.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  onSelect(): void {
    this.clicked.emit(this.conversation);
  }
}
