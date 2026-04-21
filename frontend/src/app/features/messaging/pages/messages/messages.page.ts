import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessagingService } from '../../../../core/services/messaging.service';
import { UserService } from '../../../../core/services/user.service';
import { GroupService } from '../../../../core/services/group.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { GroupDto } from '../../../../shared/models';
import { forkJoin, of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ChatContainerComponent } from '../../components/chat-container/chat-container.component';
import { ChatStore } from '../../services/chat.store';
import { ConversationService } from '../../services/conversation.service';
import { DirectConversation } from '../../models';

export type MessagingTab = 'direct' | 'groups';

export interface DirectEntry {
  userId: number;
  name: string;
  avatar?: string;
  conversationId: string;
  email?: string;
}

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatContainerComponent],
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss']
})
export class MessagesPage implements OnInit {
  private readonly messagingService = inject(MessagingService);
  private readonly userService = inject(UserService);
  private readonly groupService = inject(GroupService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly chatStore = inject(ChatStore);
  private readonly conversationService = inject(ConversationService);

  readonly activeTab = signal<MessagingTab>('direct');
  readonly directList = signal<DirectEntry[]>([]);
  readonly groupList = signal<GroupDto[]>([]);
  readonly loadingDirect = signal(true);
  readonly loadingGroups = signal(true);
  readonly selectedConversationId = signal<string | null>(null);
  readonly searchQuery = signal('');

  // Search filtered lists
  readonly filteredDirectList = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.directList();
    return this.directList().filter(d => 
      d.name.toLowerCase().includes(query) || d.email?.toLowerCase().includes(query)
    );
  });

  readonly filteredGroupList = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.groupList();
    return this.groupList().filter(g => 
      g.name.toLowerCase().includes(query) || (g.description && g.description.toLowerCase().includes(query))
    );
  });

  constructor() {
    // React to query param changes reactively
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as MessagingTab;
      const directId = params['directUserId'];
      const groupId = params['groupId'];

      if (tab) this.activeTab.set(tab);

      if (directId) {
        this.openDirectChat(Number(directId));
      } else if (groupId) {
        this.openGroupChat(Number(groupId));
      }
    });
  }

  ngOnInit(): void {
    this.loadDirectConversations();
    this.loadGroupConversations();
  }

  setTab(tab: MessagingTab): void {
    this.activeTab.set(tab);
    this.searchQuery.set(''); // Clear search when switching tabs
  }

  loadDirectConversations(): void {
    this.loadingDirect.set(true);
    const currentUserId = this.authStore.userId();
    if (!currentUserId) {
      this.loadingDirect.set(false);
      return;
    }

    this.messagingService.getPartnerIds().pipe(
      switchMap(res => {
        const partnerIds: number[] = res.data || [];
        if (partnerIds.length === 0) return of([]);
        const userReqs = partnerIds.map(id =>
          this.userService.getProfile(id).pipe(
            map(r => ({
              userId: id,
              name: r.data?.name || r.data?.username || `User ${id}`,
              avatar: r.data?.avatarUrl || undefined,
              email: r.data?.email,
              conversationId: `direct-${Math.min(currentUserId, id)}-${Math.max(currentUserId, id)}`
            } as DirectEntry)),
            catchError(() => of({ userId: id, name: `User ${id}`, avatar: undefined, conversationId: `direct-${Math.min(currentUserId, id)}-${Math.max(currentUserId, id)}` } as DirectEntry))
          )
        );
        return forkJoin(userReqs);
      }),
      catchError(() => of([] as DirectEntry[]))
    ).subscribe(entries => {
      // Merge with any manual entries to avoid race condition
      this.directList.update(current => {
        const manuallyAdded = current.filter(c => !entries.some(e => e.userId === c.userId));
        return [...manuallyAdded, ...entries];
      });
      this.loadingDirect.set(false);
    });
  }

  loadGroupConversations(): void {
    this.loadingGroups.set(true);
    this.groupService.getRandomGroups(50).pipe(
      catchError(() => of({ data: [] as GroupDto[] }))
    ).subscribe(res => {
      this.groupList.set(res.data || []);
      this.loadingGroups.set(false);
    });
  }

  async openDirectChat(userId: number): Promise<void> {
    const currentUserId = this.authStore.userId();
    if (!currentUserId || !userId) return;

    this.activeTab.set('direct');
    const convId = `direct-${Math.min(currentUserId, userId)}-${Math.max(currentUserId, userId)}`;
    this.selectedConversationId.set(convId);
    this.chatStore.selectConversation(convId);

    // Check if user is already in our sidebar list
    const existingEntry = this.directList().find(d => d.userId === userId);
    if (!existingEntry) {
      console.log('[MessagesPage] New chat partner detected, fetching profile...', userId);
      try {
        const response = await firstValueFrom(this.userService.getProfile(userId));
        const newEntry: DirectEntry = {
          userId: userId,
          name: response.data?.name || response.data?.username || `User ${userId}`,
          avatar: response.data?.avatarUrl || undefined,
          email: response.data?.email,
          conversationId: convId
        };
        this.directList.update(list => [newEntry, ...list]);

        // Register in global ChatStore so ChatHeader and other components can see it
        const newConversation: DirectConversation = {
          id: convId,
          type: 'direct',
          userId: currentUserId,
          participantId: userId,
          participantName: newEntry.name,
          participantEmail: newEntry.email || '',
          participantAvatar: newEntry.avatar,
          unreadCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        };
        this.chatStore.addConversation(newConversation);
      } catch (error) {
        console.error('[MessagesPage] Failed to fetch profile for new chat partner:', error);
      }
    }

    // Ensure messages are loaded
    await this.conversationService.selectConversationAndLoadMessages(convId);
  }

  onNewChat(): void {
    this.router.navigate(['/mentors']);
  }

  async openGroupChat(groupId: number): Promise<void> {
    const convId = `group-${groupId}`;
    this.selectedConversationId.set(convId);
    this.chatStore.selectConversation(convId);
    this.activeTab.set('groups');
    
    await this.conversationService.selectConversationAndLoadMessages(convId);
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  isDirectSelected(entry: DirectEntry): boolean {
    return this.selectedConversationId() === entry.conversationId;
  }

  isGroupSelected(group: GroupDto): boolean {
    return this.selectedConversationId() === `group-${group.id}`;
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }
}
