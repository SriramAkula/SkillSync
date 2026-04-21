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
      <div class="input-wrapper">
        <input
          #messageInput
          [ngModel]="messageContent()"
          (ngModelChange)="messageContent.set($event)"
          (keydown.enter)="sendMessage()"
          placeholder="Type a message..."
          class="message-input"
        >

        <button
          class="send-btn"
          (click)="sendMessage()"
          [disabled]="!canSend"
        >
          Send
        </button>
      </div>
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

  // State
  messageContent = signal('');
  replyingTo = signal<UIMessage | null>(null);

  // Computed properties
  get canSend(): boolean {
    const content = this.messageContent().trim();
    return content.length > 0 && content.length <= 1000 && !this.isLoading;
  }

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
    if (!this.canSend) return;

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
