import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, BehaviorSubject, of, throwError, Subscription, timer, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../store/auth.store';
import { ApiResponse, ChatMessage, PageResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  
  private readonly base = `${environment.apiUrl}/messaging`;
  
  // UI State management for chat windows
  private readonly chatConfigSubject = new BehaviorSubject<{ isOpen: boolean; title: string, recipientId?: number, groupId?: number }>({
    isOpen: false,
    title: ''
  });
  readonly chatConfig$ = this.chatConfigSubject.asObservable();
  
  // Compatibility Observables
  readonly connected$ = of(true);
  private pollingSub: Subscription | null = null;


  /**
   * Send a message via REST API
   */
  sendMessage(receiverId: number | null, content: string, groupId: number | null = null): Observable<ApiResponse<ChatMessage>> {
    const senderId = this.authStore.userId();
    if (!senderId) {
      return throwError(() => new Error('User not authenticated'));
    }

    const payload: { senderId: number, content: string, receiverId?: number, groupId?: number } = { senderId, content };
    if (receiverId) payload.receiverId = receiverId;
    if (groupId) payload.groupId = groupId;

    return this.http.post<ApiResponse<ChatMessage>>(`${this.base}`, payload);
  }

  /** 
   * Get full conversation between current user and a partner.
   * Paginated results.
   */
  getConversation(partnerId: number, page = 0, size = 12): Observable<ApiResponse<PageResponse<ChatMessage>>> {
    const userId = this.authStore.userId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.get<ApiResponse<PageResponse<ChatMessage>>>(`${this.base}/conversation/${userId}/${partnerId}`, {
      params: { page, size }
    });
  }

  /**
   * Get full conversation for a group.
   * Paginated results.
   */
  getGroupConversation(groupId: number, page = 0, size = 12): Observable<ApiResponse<PageResponse<ChatMessage>>> {
    return this.http.get<ApiResponse<PageResponse<ChatMessage>>>(`${this.base}/group/${groupId}`, {
      params: { page, size }
    });
  }

  /**
   * Get distinct user IDs that have shared conversations with current user.
   */
  getPartnerIds(): Observable<ApiResponse<number[]>> {
    const userId = this.authStore.userId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.get<ApiResponse<number[]>>(`${this.base}/partners/${userId}`);
  }

  /** 
   * Get message by ID.
   */
  getById(id: number): Observable<ApiResponse<ChatMessage>> {
    return this.http.get<ApiResponse<ChatMessage>>(`${this.base}/${id}`);
  }

  // ==================== Legacy/Bridge Methods ====================
  // (Maintained for compatibility with existing UI components)

  private readonly activeChatSubject = new BehaviorSubject<ChatMessage[]>([]);
  readonly activeChat$ = this.activeChatSubject.asObservable();

  setActiveChat(history: ChatMessage[]): void {
    this.activeChatSubject.next(history);
  }

  clearActiveChat(): void {
    this.activeChatSubject.next([]);
  }

  openPrivateChat(recipientId: number, name: string): void {
    this.chatConfigSubject.next({ isOpen: true, title: `Chat with ${name}`, recipientId });
    this.startPolling('private', recipientId);
  }

  openGroupChat(groupId: number, name: string): void {
    this.chatConfigSubject.next({ isOpen: true, title: `${name} Group Chat`, groupId });
    this.startPolling('group', groupId);
  }

  closeChat(): void {
    const current = this.chatConfigSubject.getValue();
    this.chatConfigSubject.next({ ...current, isOpen: false });
    this.stopPolling();
    this.clearActiveChat();
  }

  private startPolling(type: 'private' | 'group', id: number): void {
    this.stopPolling();
    
    // Poll every 2 seconds
    this.pollingSub = timer(0, 2000).pipe(
      switchMap(() => {
        if (type === 'private') {
          return this.getPrivateHistory(id);
        } else {
          return this.getGroupHistory(id);
        }
      })
    ).subscribe({
      error: (err) => console.error('Polling error:', err)
    });
  }

  private stopPolling(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = null;
    }
  }

  /** Active users/groups fetchers using the newer REST endpoints */
  getActiveUsers(): Observable<number[]> {
    return this.getPartnerIds().pipe(map(res => res.data || []));
  }

  getActiveGroups(): Observable<number[]> {
    // Currently backend might not have this as a separate specific endpoint, 
    // but we can default to empty or implement group partners if available.
    return of([]);
  }

  // --- Shared Component Compatibility Layer ---

  getPrivateHistory(partnerId: number): Observable<ChatMessage[]> {
    return this.getConversation(partnerId).pipe(
      map(res => {
        // Backend returns ApiResponse<PagedResponse<T>> where PagedResponse has 'content'
        let messages: ChatMessage[] = [];
        if (res.data && res.data.content) {
          messages = res.data.content;
        } else {
          messages = Array.isArray(res.data) ? res.data : [];
        }
        
        // Update the active chat state automatically
        this.setActiveChat(messages);
        return messages;
      })
    );
  }

  getGroupHistory(groupId: number): Observable<ChatMessage[]> {
    return this.getGroupConversation(groupId).pipe(
      map(res => {
        let messages: ChatMessage[] = [];
        if (res.data && res.data.content) {
          messages = res.data.content;
        } else {
          messages = Array.isArray(res.data) ? res.data : [];
        }
        this.setActiveChat(messages);
        return messages;
      })
    );
  }

  watchGroup(groupId: number): Observable<ChatMessage> {
    console.log('Watch group placeholder for:', groupId);
    return of(); 
  }

  handleIncomingMessage(message: ChatMessage): void {
    const current = this.activeChatSubject.getValue();
    this.activeChatSubject.next([...current, message]);
  }

  sendPrivate(recipientId: number, content: string): boolean {
    this.sendMessage(recipientId, content).subscribe(res => {
      if (res.data) {
        this.handleIncomingMessage(res.data);
      }
    });
    return true;
  }

  sendGroup(groupId: number, content: string): boolean {
    this.sendMessage(null, content, groupId).subscribe(res => {
      if (res.data) {
        this.handleIncomingMessage(res.data);
      }
    });
    return true;
  }
}
