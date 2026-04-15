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
      <!-- Avatar (show only if sender changed or first message) -->
      @if (showAvatar()) {
        <div class="avatar">{{ senderInitials() }}</div>
      } @else {
        <div class="avatar-spacer"></div>
      }

      <div class="message-content">
        <!-- Timestamp (show if gap > 5min or sender changed) -->
        @if (showTimestamp()) {
          <div class="timestamp-divider">{{ formatDate(message.timestamp) }}</div>
        }

        <!-- Sender name (only for group chats, received messages) -->
        @if (!isSelfMessage() && showSenderName()) {
          <div class="sender-name">{{ message.senderName || 'User' }}</div>
        }

        <!-- Message bubble -->
        <div class="bubble animate-fade-in" [class]="getBubbleClass()">
          <p class="text">{{ message.content }}</p>

          <!-- Message meta -->
          <div class="meta">
            <span class="time">{{ formatTime(message.timestamp) }}</span>
            @if (isSelfMessage()) {
              <span class="status" [class]="message.status">
                @switch (message.status) {
                  @case ('SENDING') {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 10px; height: 10px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  @case ('SENT') {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" style="width: 12px; height: 12px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  }
                  @case ('DELIVERED') {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" style="width: 14px; height: 14px;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  @case ('READ') {
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 14px; height: 14px; color: #4ade80;">
                      <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                    </svg>
                  }
                  @case ('FAILED') {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" style="width: 12px; height: 12px; color: #ef4444;">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                }
              </span>
            }
          </div>
        </div>

        <!-- Read receipt (for sent messages) -->
        @if (isSelfMessage() && message.readAt) {
          <div class="read-receipt">
            Read at {{ formatTime(message.readAt) }}
          </div>
        }
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
