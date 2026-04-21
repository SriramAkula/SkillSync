/**
 * Chat Message Models & Types
 * Core data structures for messaging feature
 */

export type MessageType = 'CHAT' | 'JOIN' | 'LEAVE' | 'SYSTEM' | 'TYPING';
export type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

/**
 * ChatMessage - Persistent message entity
 * Stored in database and sent via WebSocket
 */
export interface ChatMessage {
  id: string;
  senderId: number;
  senderName?: string;
  senderAvatar?: string;
  
  receiverId?: number; // Matches backend field name
  groupId?: number;
  
  content: string;
  type: MessageType;
  
  createdAt: Date; // Matches backend field name
  isRead: boolean;
  readAt?: Date;
  
  attachments?: MessageAttachment[];
  replyTo?: string;
  editedAt?: Date;
}

/**
 * Message Attachment (for future phase)
 */
export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  thumbnail?: string;
}

/**
 * Internal message wrapper for UI state
 * Extends ChatMessage with UI-specific properties
 */
export interface UIMessage extends ChatMessage {
  status: MessageStatus; // UI state
  isOptimistic?: boolean; // Optimistic update flag
  error?: string; // Error message if failed
}

/**
 * Typing Indicator Event (WebSocket message)
 */
export interface TypingIndicator {
  conversationId: string;
  userId: number;
  userName: string;
  isTyping: boolean;
  timestamp: Date;
}

/**
 * Read Receipt Event (WebSocket message)
 */
export interface ReadReceipt {
  messageId: string;
  readBy: number; // UserId
  readAt: Date;
  conversationId: string;
}

/**
 * Online Status Event (WebSocket message)
 */
export interface OnlineStatus {
  userId: number;
  isOnline: boolean;
  lastSeen: Date;
}

/**
 * Group Member Info
 */
export interface GroupMember {
  userId: number;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: Date;
  isOnline?: boolean;
  lastSeen?: Date;
}

/**
 * Request/Response DTOs
 */

export interface SendMessageRequest {
  content: string;
  type: MessageType;
  recipientId?: number; // Direct message
  groupId?: number; // Group message
  replyTo?: string;
}

export interface SendMessageResponse {
  id: string;
  createdAt: Date;
  status: 'SUCCESS' | 'FAILED';
  message?: ChatMessage;
  error?: string;
}

export interface FetchMessagesRequest {
  conversationId: string;
  page: number;
  pageSize: number;
  sortBy?: 'NEWEST' | 'OLDEST'; // Default: NEWEST
}

export interface FetchMessagesResponse {
  messages: ChatMessage[];
  totalCount: number;
  hasMore: boolean;
  page: number;
}

export interface MarkAsReadRequest {
  messageIds: string[];
  conversationId: string;
}

export interface MarkAsReadResponse {
  success: boolean;
  readAt: Date;
}
