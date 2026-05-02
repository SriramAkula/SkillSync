/**
 * Conversation Service
 * Builds conversations from backend messaging API
 * Uses /messages/partners/{userId} to get direct conversations
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom, tap, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ChatStore } from './chat.store';
import { ChatMessageService } from './chat-message.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../core/store/auth.store';
import { UserService } from '../../../core/services/user.service';
import {
  Conversation,
  FetchConversationsRequest,
  FetchConversationsResponse,
  DirectConversation,
  GroupConversation,
  CreateDirectConversationRequest,
  CreateDirectConversationResponse,
} from '../models';
import { ApiResponse, GroupDto } from '../../../shared/models';
import type { ChatMessage } from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private apiUrl = '/api/messaging';
  private http = inject(HttpClient);
  private chatStore = inject(ChatStore);
  private messageService = inject(ChatMessageService);
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private userService = inject(UserService);

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  /**
   * Fetch direct conversations for current user
   * Uses /messages/partners/{userId} to get list of conversation partner IDs
   * Then enriches each with user info and last message
   */
  fetchConversations(request: FetchConversationsRequest): Observable<FetchConversationsResponse> {
    const currentUserId = this.authStore.userId();
    if (!currentUserId) {
      return of({
        conversations: [],
        totalCount: 0,
        page: request.page,
        hasMore: false
      });
    }

    console.log('[ConversationService] Fetching conversations for user', currentUserId);

    // Get list of conversation partner IDs
    return this.messageService.getCurrentUserConversationPartners(currentUserId).pipe(
      catchError(error => {
        console.error('[ConversationService] Failed to fetch conversation partners:', error);
        this.chatStore.setConversationError('Failed to load conversations');
        return of([]);
      }),
      switchMap((partnerIds: number[]) => {
        if (partnerIds.length === 0) {
          return of({
            conversations: [],
            totalCount: 0,
            page: request.page,
            hasMore: false
          });
        }

        // Fetch user info and last message for each partner
        const conversationObservables = partnerIds.map(partnerId =>
          this.buildDirectConversation(currentUserId, partnerId)
        );

        return forkJoin(conversationObservables).pipe(
          map(conversations => {
            // Apply filtering and sorting
            let filtered = conversations;

            if (request.searchTerm) {
              const searchLower = request.searchTerm.toLowerCase();
              filtered = filtered.filter(conv =>
                conv.participantName?.toLowerCase().includes(searchLower) ||
                conv.participantEmail?.toLowerCase().includes(searchLower)
              );
            }

            // Sort by preference
            if (request.sortBy === 'ALPHABETICAL') {
              filtered.sort((a, b) => (a.participantName || '').localeCompare(b.participantName || ''));
            } else {
              // Default: RECENT (by lastMessageAt)
              filtered.sort((a, b) => {
                const aTime = a.lastMessageAt?.getTime() || 0;
                const bTime = b.lastMessageAt?.getTime() || 0;
                return bTime - aTime;
              });
            }

            // Apply pagination
            const start = request.page * request.pageSize;
            const end = start + request.pageSize;
            const paginated = filtered.slice(start, end);

            return {
              conversations: paginated,
              totalCount: filtered.length,
              page: request.page,
              hasMore: end < filtered.length
            };
          }),
          tap(response => {
            console.log('[ConversationService] Conversations loaded:', response);
            this.chatStore.setConversations(response.conversations);
          }),
          catchError(error => {
            console.error('[ConversationService] Error building conversations:', error);
            this.chatStore.setConversationError('Failed to load conversations');
            return of({
              conversations: [],
              totalCount: 0,
              page: request.page,
              hasMore: false
            });
          })
        );
      })
    );
  }

  /**
   * Build a DirectConversation object for a given partner
   */
  private buildDirectConversation(
    currentUserId: number,
    partnerId: number
  ): Observable<DirectConversation> {
    // Fetch user info for partner
    const userInfo$ = this.userService.getProfile(partnerId).pipe(
      map(response => {
        const userData = response.data as unknown as Record<string, unknown> & { avatar?: string };
        return {
          userId: userData['userId'] || partnerId,
          username: userData['username'] || `user${partnerId}`,
          name: userData['name'] || `User ${partnerId}`,
          email: userData['email'] || '',
          avatar: userData['avatar'] || undefined
        };
      }),
      catchError(error => {
        console.warn(`Failed to fetch user info for ${partnerId}:`, error);
        return of({
          userId: partnerId,
          username: `user${partnerId}`,
          name: `User ${partnerId}`,
          email: '',
          avatar: undefined
        });
      })
    );

    // Fetch last message (fetch first page, last message will be first in page if sorted correctly)
    const lastMessage$ = this.messageService.fetchDirectConversation(
      Math.min(currentUserId, partnerId),
      Math.max(currentUserId, partnerId),
      0,
      1
    ).pipe(
      map(response => response.messages[0] || null),
      catchError(() => of(null as ChatMessage | null))
    );

    return forkJoin({
      user: userInfo$,
      lastMessage: lastMessage$
    }).pipe(
      map(({ user, lastMessage }) => {
        const conversationId = `direct-${Math.min(currentUserId, partnerId)}-${Math.max(currentUserId, partnerId)}`;
        return {
          id: conversationId,
          type: 'direct' as const,
          userId: currentUserId,
          participantId: partnerId,
          participantName: user.name || `User ${partnerId}`,
          participantEmail: user.email || '',
          participantAvatar: user.avatar,
          lastMessage: lastMessage,
          lastMessageAt: lastMessage?.createdAt || new Date(),
          unreadCount: 0, // TODO: Implement unread count tracking
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        } as DirectConversation;
      })
    );
  }

  /**
   * Fetch a single conversation by ID
   */
  fetchConversation(conversationId: string): Observable<Conversation> {
    // Parse conversation ID to determine type and participants
    if (conversationId.startsWith('direct-')) {
      const parts = conversationId.split('-');
      const userId1 = parseInt(parts[1], 10);
      const userId2 = parseInt(parts[2], 10);
      const currentUserId = this.authStore.userId() || userId1;

      return this.buildDirectConversation(currentUserId, userId1 === currentUserId ? userId2 : userId1);
    } else if (conversationId.startsWith('group-')) {
      const groupId = parseInt(conversationId.replace('group-', ''), 10);
      return this.http.get<ApiResponse<GroupDto>>(`/api/group/${groupId}`).pipe(
        map(res => {
          const group = res.data;
          return {
            id: conversationId,
            type: 'group' as const,
            groupName: group.name,
            groupId: groupId,
            members: [],
            memberCount: group.currentMembers || 0,
            currentUserRole: 'MEMBER',
            lastMessageAt: new Date(),
            unreadCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
          } as GroupConversation;
        })
      );
    }

    throw new Error(`Unknown conversation ID format: ${conversationId}`);
  }

  /**
   * Create direct message conversation
   * (No-op since direct conversations are auto-created)
   */
  createDirectConversation(
    request: CreateDirectConversationRequest
  ): Observable<CreateDirectConversationResponse> {
    const currentUserId = this.authStore.userId();
    if (!currentUserId) {
      return of({
        success: false,
        error: 'Not authenticated'
      } as unknown as CreateDirectConversationResponse);
    }

    return this.buildDirectConversation(currentUserId, request.participantId).pipe(
      map(conversation => ({
        success: true,
        conversation
      } as CreateDirectConversationResponse)),
      tap(response => {
        if (response.success) {
          this.chatStore.addConversation(response.conversation);
        }
      }),
      catchError(error => {
        console.error('Failed to create direct conversation:', error);
        return of({
          success: false,
          error: error.message || 'Unknown error'
        } as unknown as CreateDirectConversationResponse);
      })
    );
  }

  /**
   * Select a conversation
   */
  selectConversation(conversationId: string): void {
    this.chatStore.selectConversation(conversationId);
  }

  /**
   * Update/select conversation
   */
  async selectConversationAndLoadMessages(
    conversationId: string
  ): Promise<void> {
    try {
      console.log(`[ConversationService] Selecting conversation: ${conversationId}`);

      // 1. Fetch full conversation details FIRST (before selecting).
      //    This ensures the conversation (with its type='group') is in the store
      //    before currentConversationId is set, so isGroupChat() is already
      //    correct when the signal fires — preventing sender names from flickering.
      const conversation = await firstValueFrom(
        this.fetchConversation(conversationId)
      );

      // 2. Upsert conversation into store (add or update).
      this.chatStore.upsertConversation(conversation);

      // 3. Now select — isGroupChat() will be correct immediately.
      this.chatStore.selectConversation(conversationId);

      // 4. Load messages - handles both direct and group
      console.log(`[ConversationService] Loading messages for: ${conversationId}`);
      await this.messageService.loadMessages(conversationId, 0, 50);

    } catch (error) {
      console.error('Failed to select conversation:', error);
      this.chatStore.setMessageError('Failed to select conversation');
    }
  }

  /**
   * Async wrapper for loading conversations
   */
  async loadConversations(request: FetchConversationsRequest): Promise<void> {
    this.chatStore.setLoadingConversations(true);
    try {
      console.log('[ConversationService] Loading conversations with request:', request);
      await firstValueFrom(this.fetchConversations(request));
      console.log('[ConversationService] Conversations loaded successfully');
      this.chatStore.setConversationError(null);
    } catch (error) {
      console.error('[ConversationService] Error loading conversations:', error);
      this.chatStore.setConversationError(
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    } finally {
      this.chatStore.setLoadingConversations(false);
    }
  }

  /**
   * Mark conversation as read (clear unread count)
   */
  markConversationAsRead(conversationId: string): Observable<void> {
    return of(undefined).pipe(
      tap(() => {
        this.chatStore.updateConversation(conversationId, {
          unreadCount: 0
        });
      })
    );
  }

  /**
   * Delete conversation (archive)
   */
  deleteConversation(conversationId: string): Observable<void> {
    return of(undefined).pipe(
      tap(() => {
        this.chatStore.removeConversation(conversationId);
      })
    );
  }

  /**
   * Search conversations
   */
  searchConversations(searchTerm: string): Observable<Conversation[]> {
    const request: FetchConversationsRequest = {
      page: 0,
      pageSize: 100,
      searchTerm
    };

    return this.fetchConversations(request).pipe(
      map(response => response.conversations)
    );
  }
}
