/**
 * Message Thread Component
 * Displays message history with infinite scroll
 * Auto-scrolls to latest message
 * Marks messages as read
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  computed,
  signal,
  effect,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageItemComponent } from '../message-item/message-item.component';
import { ChatStore } from '../../services/chat.store';
import type { UIMessage } from '../../models';

@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [CommonModule, MessageItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="message-thread" #threadContainer>
      <!-- Scroll to top loading -->
      @if (isLoadingOlder()) {
        <div class="loading-indicator">
          <span class="spinner"></span>
          Loading older messages...
        </div>
      }

      <!-- Empty State -->
      @if (displayedMessages().length === 0) {
        <div class="empty-state animate-fade-in">
          <div class="icon">✨</div>
          <h3>Your conversation begins here</h3>
          <p>Don't be shy! Send a message to start the exchange.</p>
        </div>
      } @else {
        <div class="messages-list">
          @for (msg of displayedMessages(); track msg.id; let i = $index; let last = $last) {
            <app-message-item
              [message]="msg"
              [currentUserId]="currentUserId()"
              [previousMessage]="i > 0 ? displayedMessages()[i - 1] : null"
              [nextMessage]="!last ? displayedMessages()[i + 1] : null"
              [isGroupChat]="isGroupChat()"
            ></app-message-item>
          }
        </div>
      }

      <!-- Scroll to bottom indicator -->
      @if (showScrollButton()) {
        <button class="scroll-to-bottom animate-slide-up" (click)="scrollToBottom()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 14px; height: 14px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
          <span>Latest Messages</span>
        </button>
      }
    </div>
  `,
  styleUrls: ['./message-thread.component.scss']
})
export class MessageThreadComponent implements AfterViewInit, OnDestroy {
  @Input() currentUserId = signal<number>(0);
  @Input() isGroupChat = signal(false);
  @Output() scrolledToTop = new EventEmitter<void>();
  @Output() scrolledNearBottom = new EventEmitter<void>();
  @Output() markAsRead = new EventEmitter<string[]>();

  @ViewChild('threadContainer') threadContainer!: ElementRef<HTMLDivElement>;

  private chatStore = inject(ChatStore);
  private scrollListener: ((e: Event) => void) | null = null;
  private autoScrollEnabled = true;

  messages = this.chatStore.currentMessages;
  isLoadingOlder = this.chatStore.isLoadingMessages;

  displayedMessages = computed(() => {
    const msgs = this.messages();
    return msgs.sort(
      (a: UIMessage, b: UIMessage) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  });

  showScrollButton = signal(false);

  constructor() {
    // Auto-scroll to bottom when new messages arrive
    effect(() => {
      if (this.messages().length > 0 && this.autoScrollEnabled) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });

    // Mark messages as read when visible
    effect(() => {
      const messages = this.displayedMessages();
      if (messages.length > 0) {
        this.markVisibleMessagesAsRead(messages);
      }
    });
  }

  ngAfterViewInit(): void {
    this.setupScrollListener();
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.scrollListener && this.threadContainer?.nativeElement) {
      this.threadContainer.nativeElement.removeEventListener(
        'scroll',
        this.scrollListener
      );
    }
  }

  private setupScrollListener(): void {
    if (!this.threadContainer?.nativeElement) return;

    this.scrollListener = (event: Event) => {
      const container = event.target as HTMLDivElement;
      const { scrollTop, scrollHeight, clientHeight } = container;

      // Check if scrolled to top (load more messages)
      if (scrollTop === 0) {
        this.scrolledToTop.emit();
      }

      // Check if near bottom
      const nearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      this.showScrollButton.set(!nearBottom);

      if (nearBottom) {
        this.autoScrollEnabled = true;
      } else {
        this.autoScrollEnabled = false;
      }

      this.scrolledNearBottom.emit();
    };

    this.threadContainer.nativeElement.addEventListener(
      'scroll',
      this.scrollListener
    );
  }

  scrollToBottom(): void {
    if (!this.threadContainer?.nativeElement) return;

    const container = this.threadContainer.nativeElement;
    container.scrollTop = container.scrollHeight;
    this.autoScrollEnabled = true;
    this.showScrollButton.set(false);
  }

  private markVisibleMessagesAsRead(messages: UIMessage[]): void {
    if (!this.threadContainer?.nativeElement) return;

    const container = this.threadContainer.nativeElement;
    const { scrollTop, clientHeight, scrollHeight } = container;

    // Get visible messages (rough estimate)
    const visibleStart = Math.max(0, scrollTop - 100);
    const visibleEnd = Math.min(scrollHeight, scrollTop + clientHeight + 100);

    const unreadMessages = messages.filter(
      msg =>
        !msg.isRead &&
        msg.senderId !== this.currentUserId() && // Only mark received messages
        new Date(msg.timestamp).getTime() >= visibleStart &&
        new Date(msg.timestamp).getTime() <= visibleEnd
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(m => m.id);
      // Debounce mark as read
      setTimeout(() => {
        this.markAsRead.emit(messageIds);
      }, 500);
    }
  }

  trackByMessageId(_index: number, message: UIMessage): string {
    return message.id;
  }
}
