/**
 * Chat Store Service
 * Manages application state for messaging feature using Angular Signals
 * 
 * Architecture:
 * - Signals for reactive state management
 * - Computed for derived state
 * - Effects for side effects (WebSocket subscriptions, etc.)
 */

import { Injectable, signal, computed } from '@angular/core';
import type {
  Conversation,
  DirectConversation,
  GroupConversation,
  UIMessage,
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChatStore {
  // ==================== Core State Signals ====================

  // Conversations
  private conversationsSignal = signal<Conversation[]>([]);
  private isLoadingConversationsSignal = signal(false);
  private conversationErrorSignal = signal<string | null>(null);

  // Current Conversation
  private currentConversationIdSignal = signal<string | null>(null);
  private messagesSignal = signal<Map<string, UIMessage[]>>(new Map());
  private isLoadingMessagesSignal = signal(false);
  private messageErrorSignal = signal<string | null>(null);

  // UI State
  private searchTermSignal = signal('');
  private sidebarOpenSignal = signal(true);
  private sortBySignal = signal<'recent' | 'alphabetical' | 'unread'>('recent');

  // Real-time State
  private typingUsersSignal = signal<Map<string, Map<number, string>>>(new Map());
  private onlineUsersSignal = signal<Set<number>>(new Set());
  private userReadReceiptsSignal = signal<Map<string, Date>>(new Map());

  // Pagination
  private messagePageNumberSignal = signal<Map<string, number>>(new Map());
  private hasMoreMessagesSignal = signal<Map<string, boolean>>(new Map());

  // ==================== Public Getters (Signals) ====================

  conversations = this.conversationsSignal.asReadonly();
  isLoadingConversations = this.isLoadingConversationsSignal.asReadonly();
  conversationError = this.conversationErrorSignal.asReadonly();

  currentConversationId = this.currentConversationIdSignal.asReadonly();
  messages = this.messagesSignal.asReadonly();
  isLoadingMessages = this.isLoadingMessagesSignal.asReadonly();
  messageError = this.messageErrorSignal.asReadonly();

  searchTerm = this.searchTermSignal.asReadonly();
  sidebarOpen = this.sidebarOpenSignal.asReadonly();
  sortBy = this.sortBySignal.asReadonly();

  typingUsers = this.typingUsersSignal.asReadonly();
  onlineUsers = this.onlineUsersSignal.asReadonly();
  userReadReceipts = this.userReadReceiptsSignal.asReadonly();

  messagePageNumber = this.messagePageNumberSignal.asReadonly();
  hasMoreMessages = this.hasMoreMessagesSignal.asReadonly();

  // ==================== Computed Properties ====================

  /**
   * Get current conversation object
   */
  currentConversation = computed(() => {
    const id = this.currentConversationIdSignal();
    if (!id) return null;
    return this.conversationsSignal().find(c => c.id === id) || null;
  });

  /**
   * Get messages for current conversation
   */
  currentMessages = computed(() => {
    const id = this.currentConversationIdSignal();
    if (!id) return [];
    return this.messagesSignal().get(id) || [];
  });

  /**
   * Filter conversations by search term, sorted by preference
   */
  filteredAndSortedConversations = computed((): Conversation[] => {
    const conversations = this.conversationsSignal();
    const searchTerm = this.searchTermSignal().toLowerCase();
    const sortBy = this.sortBySignal();

    // Filter by search term
    const filtered = conversations.filter(c => {
      const displayName = this.getConversationDisplayName(c).toLowerCase();
      return displayName.includes(searchTerm);
    });

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => {
        const aTime = a.updatedAt?.getTime() || 0;
        const bTime = b.updatedAt?.getTime() || 0;
        return bTime - aTime;
      });
    } else if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => {
        const aName = this.getConversationDisplayName(a);
        const bName = this.getConversationDisplayName(b);
        return aName.localeCompare(bName);
      });
    } else if (sortBy === 'unread') {
      filtered.sort((a, b) => {
        if (a.unreadCount === b.unreadCount) {
          return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0);
        }
        return b.unreadCount - a.unreadCount;
      });
    }

    return filtered;
  });

  /**
   * Count total unread messages across all conversations
   */
  totalUnreadCount = computed(() => {
    return this.conversationsSignal().reduce(
      (sum, c) => sum + (c.unreadCount || 0),
      0
    );
  });

  /**
   * Check if there are active conversations
   */
  hasConversations = computed(() => {
    return this.conversationsSignal().length > 0;
  });

  /**
   * Get typing indicators for current conversation
   */
  currentTypingUsers = computed(() => {
    const conversationId = this.currentConversationIdSignal();
    if (!conversationId) return new Map<number, string>();
    return this.typingUsersSignal().get(conversationId) || new Map();
  });

  /**
   * Check if conversation has newer messages
   */
  hasMoreMessagesForCurrent = computed(() => {
    const conversationId = this.currentConversationIdSignal();
    if (!conversationId) return false;
    return this.hasMoreMessagesSignal().get(conversationId) || false;
  });

  /**
   * Current page number for pagination
   */
  currentPageNumber = computed(() => {
    const conversationId = this.currentConversationIdSignal();
    if (!conversationId) return 0;
    return this.messagePageNumberSignal().get(conversationId) || 0;
  });

  // ==================== Helper Methods ====================

  /**
   * Get display name for any conversation type
   */
  getConversationDisplayName(conversation: Conversation): string {
    if (conversation.type === 'direct') {
      return (conversation as DirectConversation).participantName;
    }
    return (conversation as GroupConversation).groupName;
  }

  /**
   * Get display subtitle for conversation
   */
  getConversationSubtitle(conversation: Conversation): string {
    if (conversation.type === 'direct') {
      const direct = conversation as DirectConversation;
      return direct.participantEmail;
    }
    const group = conversation as GroupConversation;
    return `${group.memberCount} members`;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: number): boolean {
    return this.onlineUsersSignal().has(userId);
  }

  /**
   * Check if message is read
   */
  isMessageRead(messageId: string): boolean {
    return this.userReadReceiptsSignal().has(messageId);
  }

  /**
   * Get read timestamp for message
   */
  getMessageReadAt(messageId: string): Date | null {
    return this.userReadReceiptsSignal().get(messageId) || null;
  }

  // ==================== State Mutations ====================

  /**
   * Set conversations list
   */
  setConversations(conversations: Conversation[]): void {
    this.conversationsSignal.set(conversations);
  }

  /**
   * Add conversation (prevents duplicates)
   */
  addConversation(conversation: Conversation): void {
    this.conversationsSignal.update(convs => {
      // Check if already exists
      if (convs.some(c => c.id === conversation.id)) {
        return convs;
      }
      return [conversation, ...convs];
    });
  }

  /**
   * Update conversation (e.g., new unread count)
   */
  updateConversation(conversationId: string, updates: Partial<Conversation>): void {
    this.conversationsSignal.update(convs =>
      convs.map(c =>
        c.id === conversationId ? ({ ...c, ...updates } as Conversation) : c
      )
    );
  }

  /**
   * Remove conversation
   */
  removeConversation(conversationId: string): void {
    this.conversationsSignal.update(convs =>
      convs.filter(c => c.id !== conversationId)
    );
  }

  /**
   * Select a conversation (load its messages)
   */
  selectConversation(conversationId: string): void {
    // If clicking same conversation, we might want to force a refresh
    // For now, let's allow it to reset the page
    this.currentConversationIdSignal.set(conversationId);
    
    // Clear message state for this conversation to prevent flickering with old data
    this.messagesSignal.update(msgs => {
      const newMsgs = new Map(msgs);
      // We don't necessarily want to clear if we want "instant" feel, 
      // but if the data is stale (missing usernames), clearing ensures a clean fetch.
      // Let's NOT clear for now to keep it fast, the deduplication should handle it.
      return newMsgs;
    });

    // Reset message page to 0
    this.messagePageNumberSignal.update(pages => {
      const newPages = new Map(pages);
      newPages.set(conversationId, 0);
      return newPages;
    });
  }

  /**
   * Deselect current conversation
   */
  deselectConversation(): void {
    this.currentConversationIdSignal.set(null);
  }

  /**
   * Add message to current conversation
   * Handles reconciliation of optimistic updates
   */
  addMessage(conversationId: string, message: UIMessage): void {
    this.messagesSignal.update(msgs => {
      const messages = msgs.get(conversationId) || [];
      const newMessages = new Map(msgs);

      // 1. Check if this is a real message replacing an optimistic one
      // Match by tempId if available, OR by content/sender for recently sent optimistic messages
      let existingIndex = -1;
      
      if (message.tempId) {
        existingIndex = messages.findIndex(m => m.id === message.tempId || m.tempId === message.tempId);
      } else if (!message.isOptimistic) {
        // Fallback: match by content and sender for very recent optimistic messages
        existingIndex = messages.findIndex(m => 
          m.isOptimistic && 
          m.senderId === message.senderId && 
          m.content === message.content
        );
      } else {
        // Standard duplicate check for non-optimistic replacements
        if (messages.some(m => m.id === message.id)) {
          return msgs;
        }
      }

      if (existingIndex > -1) {
        // Replace existing optimistic message
        const updatedMessages = [...messages];
        updatedMessages[existingIndex] = message;
        newMessages.set(conversationId, updatedMessages.sort((a, b) =>
          new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf()
        ));
      } else {
        // Add as new message
        newMessages.set(conversationId, [...messages, message].sort((a, b) =>
          new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf()
        ));
      }

      return newMessages;
    });
  }

  /**
   * Add multiple messages (for history/polling)
   */
  addMessages(conversationId: string, newMessages: UIMessage[]): void {
    this.messagesSignal.update(msgs => {
      const existing = msgs.get(conversationId) || [];
      const combined = [...existing, ...newMessages];
      
      // IDENTITY-BASED RECONCILIATION
      // Group messages by their 'Identity Fingerprint'
      const buckets = new Map<string, UIMessage[]>();

      combined.forEach(m => {
        // Find the best bucket for this message
        let bucketKey = "";

        if (m.id && !String(m.id).startsWith('temp-')) {
          // Rule 1: Real Server ID
          bucketKey = `id-${m.id}`;
        } else if (m.tempId) {
          // Rule 2: Explicit Temp Link
          bucketKey = `temp-${m.tempId}`;
        } else {
          // Rule 3: Fuzzy Fingerprint (Sender + Content + 5min window)
          const timeBucket = Math.floor(new Date(m.createdAt).getTime() / 300000); // 5 minute blocks
          bucketKey = `fuzzy-${m.senderId}-${m.content.trim()}-${timeBucket}`;
        }

        const bucket = buckets.get(bucketKey) || [];
        bucket.push(m);
        buckets.set(bucketKey, bucket);
      });

      // Resolve each bucket to a single 'Best' message
      const uniqueResults: UIMessage[] = [];
      buckets.forEach((messages) => {
        // Pick the best one from the bucket:
        // Priority: 1. Non-optimistic, 2. Has real ID, 3. Has 'SENT' status
        const best = messages.reduce((prev, current) => {
          const currentIsTemp = !current.id || String(current.id).startsWith('temp-');
          const prevIsTemp = !prev.id || String(prev.id).startsWith('temp-');

          if (!current.isOptimistic && prev.isOptimistic) return current;
          if (!currentIsTemp && prevIsTemp) return current;
          if (current.status === 'SENT' && prev.status === 'SENDING') return current;
          
          // Preserve username if one has it and the other doesn't
          if (current.senderUsername && !prev.senderUsername) return current;
          if (!current.senderUsername && prev.senderUsername) return prev;
          
          return prev;
        });
        uniqueResults.push(best);
      });

      // Final Deduplication by Real ID (just in case)
      const finalMap = new Map<string, UIMessage>();
      uniqueResults.forEach(m => {
        const isTemp = !m.id || String(m.id).startsWith('temp-');
        const key = !isTemp ? String(m.id) : (m.tempId || String(m.id));
        const existing = finalMap.get(key);
        if (!existing || (!m.isOptimistic && existing.isOptimistic)) {
          finalMap.set(key, m);
        }
      });

      const unique = Array.from(finalMap.values());
      
      // Sort by createdAt
      unique.sort((a, b) =>
        new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf()
      );

      const newMsgs = new Map(msgs);
      newMsgs.set(conversationId, unique);
      return newMsgs;
    });
  }

  /**
   * Update message (e.g., delivery status)
   */
  updateMessage(conversationId: string, messageId: string, updates: Partial<UIMessage>): void {
    this.messagesSignal.update(msgs => {
      const messages = msgs.get(conversationId) || [];
      const newMsgs = new Map(msgs);
      newMsgs.set(
        conversationId,
        messages.map(m =>
          m.id === messageId ? { ...m, ...updates } : m
        )
      );
      return newMsgs;
    });
  }

  /**
   * Clear messages for a conversation
   */
  clearMessages(conversationId: string): void {
    this.messagesSignal.update(msgs => {
      const newMsgs = new Map(msgs);
      newMsgs.delete(conversationId);
      return newMsgs;
    });
  }

  /**
   * Set loading states
   */
  setLoadingConversations(loading: boolean): void {
    this.isLoadingConversationsSignal.set(loading);
  }

  setLoadingMessages(loading: boolean): void {
    this.isLoadingMessagesSignal.set(loading);
  }

  /**
   * Set error states
   */
  setConversationError(error: string | null): void {
    this.conversationErrorSignal.set(error);
  }

  setMessageError(error: string | null): void {
    this.messageErrorSignal.set(error);
  }

  /**
   * Update search term
   */
  setSearchTerm(term: string): void {
    this.searchTermSignal.set(term);
  }

  /**
   * Update sort preference
   */
  setSortBy(sortBy: 'recent' | 'alphabetical' | 'unread'): void {
    this.sortBySignal.set(sortBy);
  }

  /**
   * Toggle sidebar visibility (mobile)
   */
  toggleSidebar(): void {
    this.sidebarOpenSignal.update(open => !open);
  }

  setSidebarOpen(open: boolean): void {
    this.sidebarOpenSignal.set(open);
  }

  // ==================== Real-time State Updates ====================

  /**
   * Add/update typing indicator
   */
  addTypingUser(conversationId: string, userId: number, userName: string): void {
    this.typingUsersSignal.update(typing => {
      const newTyping = new Map(typing);
      const convTyping = new Map(newTyping.get(conversationId) || new Map());
      convTyping.set(userId, userName);
      newTyping.set(conversationId, convTyping);
      return newTyping;
    });
  }

  /**
   * Remove typing indicator
   */
  removeTypingUser(conversationId: string, userId: number): void {
    this.typingUsersSignal.update(typing => {
      const newTyping = new Map(typing);
      const convTyping = new Map(newTyping.get(conversationId));
      convTyping.delete(userId);
      if (convTyping.size === 0) {
        newTyping.delete(conversationId);
      } else {
        newTyping.set(conversationId, convTyping);
      }
      return newTyping;
    });
  }

  /**
   * Clear all typing indicators for conversation
   */
  clearTypingUsers(conversationId: string): void {
    this.typingUsersSignal.update(typing => {
      const newTyping = new Map(typing);
      newTyping.delete(conversationId);
      return newTyping;
    });
  }

  /**
   * Update online status
   */
  setUserOnline(userId: number, isOnline: boolean): void {
    this.onlineUsersSignal.update(online => {
      const newOnline = new Set(online);
      if (isOnline) {
        newOnline.add(userId);
      } else {
        newOnline.delete(userId);
      }
      return newOnline;
    });
  }

  /**
   * Add read receipt
   */
  addReadReceipt(messageId: string, readAt: Date): void {
    this.userReadReceiptsSignal.update(receipts => {
      const newReceipts = new Map(receipts);
      newReceipts.set(messageId, readAt);
      return newReceipts;
    });
  }

  /**
   * Add multiple read receipts
   */
  addReadReceipts(receipts: Map<string, Date>): void {
    this.userReadReceiptsSignal.update(existing => {
      const newReceipts = new Map(existing);
      receipts.forEach((readAt, messageId) => {
        newReceipts.set(messageId, readAt);
      });
      return newReceipts;
    });
  }

  // ==================== Pagination ====================

  /**
   * Increment page number for conversation
   */
  incrementPageNumber(conversationId: string): void {
    this.messagePageNumberSignal.update(pages => {
      const newPages = new Map(pages);
      const current = newPages.get(conversationId) || 0;
      newPages.set(conversationId, current + 1);
      return newPages;
    });
  }

  /**
   * Set has more flag for conversation
   */
  setHasMoreMessages(conversationId: string, hasMore: boolean): void {
    this.hasMoreMessagesSignal.update(more => {
      const newMore = new Map(more);
      newMore.set(conversationId, hasMore);
      return newMore;
    });
  }

  // ==================== Reset/Clear ====================

  /**
   * Reset entire store (logout)
   */
  reset(): void {
    this.conversationsSignal.set([]);
    this.currentConversationIdSignal.set(null);
    this.messagesSignal.set(new Map());
    this.searchTermSignal.set('');
    this.isLoadingConversationsSignal.set(false);
    this.isLoadingMessagesSignal.set(false);
    this.conversationErrorSignal.set(null);
    this.messageErrorSignal.set(null);
    this.typingUsersSignal.set(new Map());
    this.onlineUsersSignal.set(new Set());
    this.userReadReceiptsSignal.set(new Map());
    this.messagePageNumberSignal.set(new Map());
    this.hasMoreMessagesSignal.set(new Map());
  }
}
