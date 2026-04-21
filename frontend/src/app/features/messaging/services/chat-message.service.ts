/**
 * Chat Message Service
 * Handles HTTP-based messaging via REST API
 * Fetches messages from /messages/conversation/{user1}/{user2}
 * Sends messages to /messages endpoint
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, firstValueFrom, tap, map, catchError } from 'rxjs';
import { ChatStore } from './chat.store';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../core/auth/auth.store';
import type {
  ChatMessage,
  UIMessage,
  SendMessageRequest,
  SendMessageResponse,
  MarkAsReadRequest,
  MarkAsReadResponse,
} from '../models';
import { ApiResponse } from '../../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ChatMessageService {
  private apiUrl = '/api/messaging';
  private http = inject(HttpClient);
  private chatStore = inject(ChatStore);
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);

  // Message received subject (HTTP polling)
  private messageReceivedSubject = new Subject<ChatMessage>();
  public messageReceived$ = this.messageReceivedSubject.asObservable();

  // Message send status for optimistic updates
  private messageSendingSubject = new Subject<UIMessage>();
  public messageSending$ = this.messageSendingSubject.asObservable();

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  /**
   * Fetch direct message conversation between two users
   * GET /messages/conversation/{userId1}/{userId2}?page=0&size=50
   */
  fetchDirectConversation(
    userId1: number,
    userId2: number,
    page = 0,
    size = 50
  ): Observable<{ messages: ChatMessage[]; pageNumber: number; pageSize: number; totalElements: number; totalPages: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    console.log(`[ChatMessageService] Fetching direct conversation between ${userId1} and ${userId2}`, { page, size });

    return this.http
      .get<ApiResponse<{ content: ChatMessage[]; pageNumber: number; pageSize: number; totalElements: number; totalPages: number }>>(`${this.apiUrl}/conversation/${userId1}/${userId2}`, {
        params,
        headers: this.getHeaders()
      })
      .pipe(
        map(response => ({
          messages: response.data.content || [],
          pageNumber: response.data.pageNumber,
          pageSize: response.data.pageSize,
          totalElements: response.data.totalElements,
          totalPages: response.data.totalPages
        })),
        tap(response => {
          console.log('[ChatMessageService] Direct conversation fetched:', response);
          // Map response to UIMessage with DELIVERED status
          const uiMessages = response.messages.map((msg: ChatMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            status: 'DELIVERED' as const
          }));
          const conversationId = `direct-${Math.min(userId1, userId2)}-${Math.max(userId1, userId2)}`;
          this.chatStore.addMessages(conversationId, uiMessages);
        }),
        catchError(error => {
          console.error('[ChatMessageService] Failed to fetch direct conversation:', error);
          throw error;
        })
      );
  }

  /**
   * Get conversation partners for current user
   * GET /messages/partners/{userId}
   * Returns list of user IDs that current user has direct conversations with
   */
  getCurrentUserConversationPartners(userId: number): Observable<number[]> {
    console.log(`[ChatMessageService] Fetching conversation partners for user ${userId}`);

    return this.http
      .get<ApiResponse<number[]>>(`${this.apiUrl}/partners/${userId}`, {
        headers: this.getHeaders()
      })
      .pipe(
        map(response => response.data || []),
        tap(partners => {
          console.log('[ChatMessageService] Conversation partners:', partners);
        }),
        catchError(error => {
          console.error('[ChatMessageService] Failed to fetch conversation partners:', error);
          throw error;
        })
      );
  }

  /**
   * Send message via REST API
   * POST /messages
   */
  sendMessage(request: SendMessageRequest): Observable<SendMessageResponse> {
    const payload = {
      content: request.content,
      senderId: this.authStore.userId(),
      receiverId: request.recipientId, // Map recipientId to receiverId for backend
      groupId: request.groupId,
    };

    console.log('[ChatMessageService] Sending message:', payload);

    return this.http
      .post<ApiResponse<ChatMessage>>(`${this.apiUrl}`, payload, { headers: this.getHeaders() })
      .pipe(
        map(apiRes => {
          const response = apiRes.data;
          console.log('[ChatMessageService] Message sent successfully:', response);
          const message: UIMessage = {
            id: response.id,
            senderId: this.authStore.userId() || 0,
            content: response.content || '',
            type: 'CHAT',
            timestamp: new Date(response.timestamp),
            isRead: false,
            status: 'SENT' as const
          };
          return {
            id: response.id,
            timestamp: new Date(response.timestamp),
            status: 'SUCCESS' as const,
            message
          } as SendMessageResponse;
        }),
        tap(response => {
          if (response.status === 'SUCCESS' && response.message) {
            const conversationId = request.groupId?.toString() || request.recipientId?.toString();
            if (conversationId) {
              const uiMessage: UIMessage = {
                ...response.message,
                status: 'SENT',
              };
              this.chatStore.addMessage(conversationId, uiMessage);
              this.messageSendingSubject.next(uiMessage);
            }
          }
        }),
        catchError(error => {
          console.error('[ChatMessageService] Failed to send message:', error);
          throw error;
        })
      );
  }

  /**
   * Send message optimistically
   * Creates temporary message while waiting for server confirmation
   */
  sendMessageOptimistic(
    conversationId: string,
    request: SendMessageRequest,
    currentUserId: number
  ): UIMessage {
    const tempMessage: UIMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      senderId: currentUserId,
      content: request.content,
      type: request.type || 'CHAT',
      timestamp: new Date(),
      isRead: false,
      recipientId: request.recipientId,
      groupId: request.groupId,
      status: 'SENDING',
      isOptimistic: true,
    };

    this.chatStore.addMessage(conversationId, tempMessage);
    this.messageSendingSubject.next(tempMessage);

    return tempMessage;
  }

  /**
   * Get single message by ID
   * GET /messages/{id}
   */
  getMessageById(messageId: string): Observable<ChatMessage> {
    return this.http
      .get<ApiResponse<ChatMessage>>(`${this.apiUrl}/${messageId}`, {
        headers: this.getHeaders()
      })
      .pipe(
        map(response => ({
          ...response.data,
          timestamp: new Date(response.data.timestamp),
          readAt: response.data.readAt ? new Date(response.data.readAt) : undefined
        })),
        catchError(error => {
          console.error('[ChatMessageService] Failed to fetch message:', error);
          throw error;
        })
      );
  }

  /**
   * Mark messages as read
   */
  markAsRead(request: MarkAsReadRequest): Observable<MarkAsReadResponse> {
    console.log('[ChatMessageService] Marking messages as read:', request);
    
    return this.http
      .patch<{ readAt: string }>(
        `${this.apiUrl}/mark-read`,
        request,
        { headers: this.getHeaders() }
      )
      .pipe(
        map(response => ({
          success: true,
          readAt: new Date(response.readAt || Date.now())
        })),
        tap(response => {
          // Update store with read receipts
          const receipts = new Map<string, Date>();
          request.messageIds.forEach(id => {
            receipts.set(id, response.readAt);
          });
          this.chatStore.addReadReceipts(receipts);

          // Update UI messages to READ
          request.messageIds.forEach(messageId => {
            this.chatStore.updateMessage(request.conversationId, messageId, {
              isRead: true,
              readAt: response.readAt,
              status: 'READ',
            });
          });
        }),
        catchError(error => {
          console.error('[ChatMessageService] Failed to mark as read:', error);
          return [{
            success: false,
            readAt: new Date()
          }];
        })
      );
  }

  /**
   * Mark single message as read (convenience method)
   */
  markMessageAsRead(messageId: string, conversationId: string): Observable<MarkAsReadResponse> {
    return this.markAsRead({
      messageIds: [messageId],
      conversationId,
    });
  }

  /**
   * Delete message (soft delete)
   */
  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${messageId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Edit message
   */
  editMessage(messageId: string, newContent: string): Observable<ChatMessage> {
    return this.http.patch<ChatMessage>(
      `${this.apiUrl}/${messageId}`,
      { content: newContent }
    );
  }

  /**
   * Search messages in a conversation
   */
  searchMessages(
    conversationId: string,
    searchTerm: string,
    limit = 50
  ): Observable<ChatMessage[]> {
    const params = new HttpParams()
      .set('conversationId', conversationId)
      .set('searchTerm', searchTerm)
      .set('limit', limit.toString());

    return this.http.get<ChatMessage[]>(
      `${this.apiUrl}/search`,
      { params }
    );
  }

  /**
   * Emit message received from WebSocket
   * (Called by MessagingService when message arrives)
   */
  onMessageReceived(message: ChatMessage): void {
    this.messageReceivedSubject.next(message);

    // Auto-add to store
    const conversationId = message.groupId?.toString() || message.recipientId?.toString();
    if (conversationId) {
      const uiMessage: UIMessage = {
        ...message,
        status: 'DELIVERED',
      };
      this.chatStore.addMessage(conversationId, uiMessage);

      // Update conversation's last message
      this.chatStore.updateConversation(conversationId, {
        lastMessage: message,
        lastMessageAt: new Date(message.timestamp),
      });
    }
  }

  /**
   * Load messages with store updates
   */
  async loadMessages(
    conversationId: string,
    page = 0,
    pageSize = 50
  ): Promise<void> {
    this.chatStore.setLoadingMessages(true);
    try {
      console.log('[ChatMessageService] Loading messages for conversation:', conversationId, 'page:', page);
      let messages$: Observable<ChatMessage[]>;

      if (conversationId.startsWith('direct-')) {
        const [, id1, id2] = conversationId.split('-');
        messages$ = this.fetchDirectConversation(Number(id1), Number(id2), page, pageSize)
          .pipe(map(res => res.messages));
      } else if (conversationId.startsWith('group-')) {
        const groupId = Number(conversationId.replace('group-', ''));
        messages$ = this.http.get<ApiResponse<{ content: ChatMessage[] }>>(
          `${this.apiUrl}/group/${groupId}?page=${page}&size=${pageSize}`,
          { headers: this.getHeaders() }
        ).pipe(map(res => res.data.content || []));
      } else {
        throw new Error('Invalid conversation ID format');
      }

      const messages = await firstValueFrom(messages$);
      
      const uiMessages = messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        status: 'DELIVERED' as const
      }));

      this.chatStore.addMessages(conversationId, uiMessages);
      console.log('[ChatMessageService] Messages loaded successfully');
      this.chatStore.setMessageError(null);
    } catch (error) {
      console.error('[ChatMessageService] Error loading messages:', error);
      this.chatStore.setMessageError(
        error instanceof Error ? error.message : 'Failed to load messages'
      );
      throw error;
    } finally {
      this.chatStore.setLoadingMessages(false);
    }
  }

  /**
   * Async wrapper for sending message
   */
  async sendMessageAsync(request: SendMessageRequest): Promise<SendMessageResponse> {
    console.log('[ChatMessageService] Sending message:', request);
    try {
      const response = await firstValueFrom(this.sendMessage(request));
      console.log('[ChatMessageService] Message sent successfully:', response);
      return response;
    } catch (error) {
      console.error('[ChatMessageService] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Async wrapper for fetching direct conversation
   */
  async fetchDirectConversationAsync(
    userId1: number,
    userId2: number,
    page = 0,
    size = 50
  ): Promise<ChatMessage[]> {
    return firstValueFrom(
      this.fetchDirectConversation(userId1, userId2, page, size)
    ).then(response => response.messages);
  }

  /**
   * Private helper removed in favor of direct/group specific loading
   */
  private fetchMessages(): Observable<ChatMessage[]> {
    return of([]);
  }
}
