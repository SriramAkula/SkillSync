/**
 * Conversation Models & Types
 * Represents direct messages and group chats
 */

import type { ChatMessage, GroupMember } from './chat.models';

export type ConversationType = 'direct' | 'group';

/**
 * Direct Message Conversation
 */
export interface DirectConversation {
  id: string;
  type: 'direct';
  
  // Participants
  userId: number; // Current user (for reference)
  participantId: number;
  participantName: string;
  participantEmail: string;
  participantAvatar?: string;
  
  // Message metadata
  lastMessage?: ChatMessage;
  lastMessageAt?: Date;
  unreadCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * Group Chat Conversation
 */
export interface GroupConversation {
  id: string;
  type: 'group';
  
  // Group info
  groupId: number;
  groupName: string;
  groupDescription?: string;
  groupAvatar?: string;
  
  // Members
  members: GroupMember[];
  memberCount: number;
  currentUserRole: 'ADMIN' | 'MEMBER';
  
  // Message metadata
  lastMessage?: ChatMessage;
  lastMessageAt?: Date;
  unreadCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * Union type: Either direct or group conversation
 */
export type Conversation = DirectConversation | GroupConversation;

/**
 * Conversation type guard
 */
export function isDirectConversation(
  conversation: Conversation
): conversation is DirectConversation {
  return conversation.type === 'direct';
}

export function isGroupConversation(
  conversation: Conversation
): conversation is GroupConversation {
  return conversation.type === 'group';
}

/**
 * Computed/Display properties
 */
export interface ConversationDisplay {
  id: string;
  name: string;
  avatar?: string;
  subtitle: string; // Email (direct) or member count (group)
  lastMessagePreview: string;
  unreadBadge: number | null;
  isOnline?: boolean; // For direct messages
  type: ConversationType;
}

/**
 * Request/Response DTOs
 */

export interface FetchConversationsRequest {
  type?: 'direct' | 'group' | 'all'; // Default: all
  page: number;
  pageSize: number;
  sortBy?: 'RECENT' | 'ALPHABETICAL' | 'UNREAD'; // Default: RECENT
  searchTerm?: string;
}

export interface FetchConversationsResponse {
  conversations: Conversation[];
  totalCount: number;
  page: number;
  hasMore: boolean;
}

export interface CreateDirectConversationRequest {
  participantId: number;
}

export interface CreateDirectConversationResponse {
  success: boolean;
  conversation: DirectConversation;
  error?: string;
}

export interface CreateGroupConversationRequest {
  groupName: string;
  groupDescription?: string;
  memberIds: number[];
  groupAvatar?: string;
}

export interface CreateGroupConversationResponse {
  success: boolean;
  conversation: GroupConversation;
  error?: string;
}

export interface UpdateConversationRequest {
  conversationId: string;
  type: 'direct' | 'group';
  muteNotifications?: boolean;
  archiveConversation?: boolean;
}

export interface DeleteConversationRequest {
  conversationId: string;
  type: 'direct' | 'group';
}

export interface DeleteConversationResponse {
  success: boolean;
  error?: string;
}

export interface SearchConversationsRequest {
  searchTerm: string;
  type?: 'direct' | 'group' | 'all';
  limit?: number; // Default: 20
}

export interface SearchConversationsResponse {
  results: Conversation[];
  totalCount: number;
}
