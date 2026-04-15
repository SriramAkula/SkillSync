/**
 * Chat Container Component
 * Main orchestrator for the messaging feature
 * Manages conversation selection, message loading, sending (simple HTTP flow)
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatStore } from '../../services/chat.store';
import { ConversationService } from '../../services/conversation.service';
import { ChatMessageService } from '../../services/chat-message.service';
import { ConversationListComponent } from '../conversation-list/conversation-list.component';
import { MessageThreadComponent } from '../message-thread/message-thread.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { AuthStore } from '../../../../core/auth/auth.store';
import { Subject } from 'rxjs';
import type { Conversation, SendMessageRequest, DirectConversation, GroupConversation } from '../../models';

@Component({
  selector: 'app-chat-container',
  standalone: true,
  imports: [
    CommonModule,
    ConversationListComponent,
    ChatHeaderComponent,
    MessageThreadComponent,
    MessageInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-container.component.html',
  styleUrls: ['./chat-container.component.scss']
})
export class ChatContainerComponent implements OnInit, OnDestroy {
  private store = inject(ChatStore);
  private conversationService = inject(ConversationService);
  private messageService = inject(ChatMessageService);
  private authStore = inject(AuthStore);

  chatStore = this.store;
  
  // Get current user ID from AuthStore
  currentUserId = computed(() => {
    const id = this.authStore.userId();
    console.log('[ChatContainer] Current User ID:', id);
    return id || 0;
  });

  isGroupChat = computed(() => {
    const conv = this.chatStore.currentConversation();
    return conv?.type === 'group';
  });

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Load initial conversations
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== Conversation Management ====================

  private async loadConversations(): Promise<void> {
    try {
      console.log('[ChatContainer] Loading conversations...');
      this.chatStore.setLoadingConversations(true);
      this.chatStore.setConversationError(null);
      await this.conversationService.loadConversations({
        type: 'all',
        page: 0,
        pageSize: 50,
        sortBy: 'RECENT',
      });
      console.log('[ChatContainer] Conversations loaded successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load conversations';
      console.error('[ChatContainer] Conversation load error:', error);
      this.chatStore.setConversationError(errorMsg);
    } finally {
      this.chatStore.setLoadingConversations(false);
    }
  }

  async onConversationSelected(conversation: Conversation): Promise<void> {
    // Load messages for this conversation
    console.log('[ChatContainer] Selected conversation:', conversation.id);
    this.store.selectConversation(conversation.id);
    try {
      await this.messageService.loadMessages(conversation.id, 0, 50);
      console.log('[ChatContainer] Messages loaded for conversation:', conversation.id);
    } catch (error) {
      console.error('[ChatContainer] Failed to load messages:', error);
    }
  }

  private readonly router = inject(Router);

  onNewChatClicked(): void {
    console.log('[ChatContainer] Navigating to expert directory for new chat');
    this.router.navigate(['/mentors']);
  }

  // ==================== Message Management ====================

  async onMessageSent(content: string): Promise<void> {
    const conversation = this.chatStore.currentConversation();
    if (!conversation) return;

    let sendRequest: SendMessageRequest;

    if (conversation.type === 'direct') {
      const direct = conversation as DirectConversation;
      sendRequest = {
        content,
        type: 'CHAT',
        recipientId: direct.participantId,
      };
    } else {
      const group = conversation as GroupConversation;
      sendRequest = {
        content,
        type: 'CHAT',
        groupId: group.groupId,
      };
    }

    // Optimistic update
    const tempMessage = this.messageService.sendMessageOptimistic(
      conversation.id,
      sendRequest,
      this.currentUserId()
    );

    // Send to server
    try {
      const response = await this.messageService.sendMessageAsync(sendRequest);
      if (response.status === 'SUCCESS') {
        // Update temp message to SENT
        this.store.updateMessage(conversation.id, tempMessage.id, {
          status: 'SENT',
          id: response.message?.id || tempMessage.id,
        });
      }
    } catch (error) {
      // Mark message as FAILED
      this.store.updateMessage(conversation.id, tempMessage.id, {
        status: 'FAILED',
        error: 'Failed to send message',
      });
      console.error('Failed to send message:', error);
    }
  }

  async onScrolledToTop(): Promise<void> {
    const conversation = this.chatStore.currentConversation();
    if (!conversation) return;

    const hasMore = this.chatStore.hasMoreMessagesForCurrent();
    if (hasMore) {
      await this.messageService.loadMessages(conversation.id);
    }
  }

  async onMarkAsRead(messageIds: string[]): Promise<void> {
    const conversation = this.chatStore.currentConversation();
    if (!conversation || messageIds.length === 0) return;

    try {
      await this.messageService.markAsRead({
        messageIds,
        conversationId: conversation.id,
      }).toPromise();
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }

  onTypingStatusChanged(isTyping: boolean): void {
    // TODO: Implement typing indicators later
    // For now, just log for debugging
    console.log('[Typing] Status changed:', isTyping);
  }

  // ==================== UI Actions ====================

  onInfoClicked(): void {
    // TODO: Open conversation info modal
    console.log('Info clicked');
  }

  onCallClicked(): void {
    // TODO: Start video call
    console.log('Call clicked');
  }

  onMoreClicked(): void {
    // TODO: Open context menu
    console.log('More clicked');
  }

  getConversationType(): 'direct' | 'group' {
    const conv = this.chatStore.currentConversation();
    return conv?.type === 'group' ? 'group' : 'direct';
  }
}
