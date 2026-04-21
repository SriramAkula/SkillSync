/**
 * Message Item Component
 * Displays a single message bubble with proper styling and grouping
 * Supports self messages (right-aligned, purple) and received messages (left-aligned, dark)
 */

import {
  Component,
  Input,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UIMessage } from '../../models';

@Component({
  selector: 'app-message-item',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="message-container" [class.self]="isSelfMessage()">
      <div class="message-content">
        <!-- Message bubble -->
        <div class="bubble animate-fade-in" [class]="getBubbleClass()">
          <p class="text">{{ message.content }}</p>
          <div class="bubble-footer">
            <span class="time">{{ formatTime(message.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./message-item.component.scss']
})
export class MessageItemComponent {
  @Input() message!: UIMessage;
  @Input() currentUserId!: number;
  @Input() nextMessage: UIMessage | null = null;
  @Input() previousMessage: UIMessage | null = null;
  @Input() isGroupChat = false;

  isSelfMessage = computed(() => this.message.senderId === this.currentUserId);

  showAvatar = computed(() => {
    if (this.isSelfMessage()) return false;
    if (!this.previousMessage) return true;
    return this.previousMessage.senderId !== this.message.senderId;
  });

  showSenderName = computed(
    () => this.isGroupChat && !this.isSelfMessage()
  );

  showTimestamp = computed(() => {
    if (!this.previousMessage) return true;
    const diff =
      new Date(this.message.timestamp).getTime() -
      new Date(this.previousMessage.timestamp).getTime();
    return diff > 5 * 60 * 1000; // 5 minutes
  });

  senderInitials = computed(() => {
    const name = this.message.senderName || 'U';
    return name
      .split(' ')
      .map((n: string) => n.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  });

  getBubbleClass(): string {
    if (this.message.type === 'SYSTEM') return 'system';
    if (this.isSelfMessage()) {
      return `self ${this.message.status === 'FAILED' ? 'failed' : ''}`;
    }
    return 'other';
  }

  formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }
}
