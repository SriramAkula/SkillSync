/**
 * Conversation List Component
 * Displays all conversations with search, filter, and sort capabilities
 * Auto-updates when conversations change
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationItemComponent } from '../conversation-item/conversation-item.component';
import { ChatStore } from '../../services/chat.store';
import type { Conversation } from '../../models';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ConversationItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent {
  @Input() selectedConversationId = signal<string | null>(null);
  @Output() conversationSelected = new EventEmitter<Conversation>();
  @Output() newChatClicked = new EventEmitter<void>();

  searchInput = signal('');
  currentSort = signal<'recent' | 'alphabetical' | 'unread'>('recent');

  private chatStore = inject(ChatStore);

  sortOptions = [
    { label: 'Recent', value: 'recent' as const },
    { label: 'A-Z', value: 'alphabetical' as const },
    { label: 'Unread', value: 'unread' as const },
  ];

  isLoading = this.chatStore.isLoadingConversations;
  conversations = this.chatStore.conversations;

  filteredConversations = computed(() => {
    const searchTerm = this.searchInput().toLowerCase();
    let filtered = this.conversations();

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((c: Conversation) => {
        const name = this.chatStore.getConversationDisplayName(c).toLowerCase();
        return name.includes(searchTerm);
      });
    }

    // Sort
    const sortBy = this.currentSort();
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a: Conversation, b: Conversation) => {
          const aName = this.chatStore.getConversationDisplayName(a);
          const bName = this.chatStore.getConversationDisplayName(b);
          return aName.localeCompare(bName);
        });
        break;
      case 'unread':
        filtered.sort((a: Conversation, b: Conversation) => {
          if (a.unreadCount === b.unreadCount) {
            return (
              (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
            );
          }
          return b.unreadCount - a.unreadCount;
        });
        break;
      case 'recent':
      default:
        filtered.sort(
          (a: Conversation, b: Conversation) =>
            (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
        );
    }

    return filtered;
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput.set(value);
  }

  clearSearch(): void {
    this.searchInput.set('');
  }

  onSort(sortBy: 'recent' | 'alphabetical' | 'unread'): void {
    this.currentSort.set(sortBy);
    this.chatStore.setSortBy(sortBy);
  }

  onSelectConversation(conversation: Conversation): void {
    this.selectedConversationId.set(conversation.id);
    // Let the parent (ChatContainer) handle the store selection to avoid double-triggers
    this.conversationSelected.emit(conversation);
  }

  isConversationSelected(conversationId: string): boolean {
    return this.selectedConversationId() === conversationId;
  }

  onNewChat(): void {
    this.newChatClicked.emit();
  }

  trackByConversationId(
    _index: number,
    conversation: Conversation
  ): string {
    return conversation.id;
  }
}
