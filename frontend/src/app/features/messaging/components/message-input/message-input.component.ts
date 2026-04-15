/**
 * Message Input Component
 * Handles message composition and sending (simple HTTP flow)
 * Features:
 * - Text input with reply support
 * - Keyboard shortcuts (Ctrl+Enter to send)
 * - File attachments (future phase)
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { UIMessage } from '../../models';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="message-input-container">
      <!-- Reply preview -->
      @if (replyingTo()) {
        <div class="reply-preview">
          <div class="reply-header">
            <span class="reply-label">Replying to {{ replyingTo()?.senderName || 'message' }}</span>
            <button class="cancel-reply" (click)="cancelReply()" title="Cancel reply">×</button>
          </div>
          <p class="reply-content">{{ replyingTo()?.content }}</p>
        </div>
      }

      <!-- Character count -->
      @if (messageContent().length > 200) {
        <div class="char-count animate-fade-in">
          {{ messageContent().length }}/1000
        </div>
      }

      <!-- Main input area -->
      <div class="input-wrapper">
        <!-- Attachment button (future feature) -->
        <button class="input-button" title="Add attachment" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
        </button>

        <!-- Text input -->
        <textarea
          #messageInput
          [(ngModel)]="messageContent"
          (input)="onInput()"
          (keydown)="onKeydown($event)"
          placeholder="Write a message..."
          class="message-input"
          rows="1"
        ></textarea>

        <!-- Send button -->
        <button
          class="send-button"
          (click)="sendMessage()"
          [disabled]="!canSend()"
          title="Send (Ctrl+Enter)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>

      <!-- Typing indicator -->
      @if (typingUsersCount() > 0) {
        <div class="typing-indicator-row">
          <div class="typing-indicator">
            <div class="dots"><span></span><span></span><span></span></div>
            <span>someone is typing...</span>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./message-input.component.scss']
})
export class MessageInputComponent {
  @Input() conversationType: 'direct' | 'group' = 'direct';
  @Input() isLoading = false;
  @Input() typingUsers: Map<number, string> = new Map<number, string>();

  @Output() messageSent = new EventEmitter<string>();
  @Output() typingStatusChanged = new EventEmitter<boolean>();
  @Output() replyCanceled = new EventEmitter<void>();

  @ViewChild('messageInput') messageInputRef!: ElementRef<HTMLTextAreaElement>;

  // State signals
  messageContent = signal('');
  replyingTo = signal<UIMessage | null>(null);

  // Computed properties
  canSend = computed(() => {
    const content = this.messageContent().trim();
    return content.length > 0 && content.length <= 1000 && !this.isLoading;
  });

  typingUsersCount = computed(() => this.typingUsers.size);

  constructor() {
    // No typing debounce - removed WebSocket typing indicators
  }

  // Event handlers
  onInput(): void {
    // Auto-expand textarea
    setTimeout(() => {
      this.autoResizeTextarea();
    }, 0);
  }

  onKeydown(event: KeyboardEvent): void {
    // Send on Ctrl+Enter or Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage();
    }

    // Allow Tab for accessibility
    if (event.key === 'Tab') {
      event.preventDefault();
      const textarea = this.messageInputRef.nativeElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      this.messageContent.update(content =>
        content.substring(0, start) + '\t' + content.substring(end)
      );

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      });
    }
  }

  sendMessage(): void {
    const content = this.messageContent().trim();
    if (!this.canSend()) return;

    console.log('[MessageInput] Sending message:', content);
    this.messageSent.emit(content);
    this.messageContent.set('');
    this.autoResizeTextarea();
  }

  cancelReply(): void {
    this.replyingTo.set(null);
    this.replyCanceled.emit();
  }

  setReplyingTo(message: UIMessage | null): void {
    this.replyingTo.set(message);
  }

  private autoResizeTextarea(): void {
    const textarea = this.messageInputRef.nativeElement;
    textarea.style.height = 'auto';
    const height = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${height}px`;
  }

  focusInput(): void {
    this.messageInputRef?.nativeElement?.focus();
  }
}
