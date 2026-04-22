export interface Group {
  id: number;
  creatorId: number;
  name: string;
  skillId: number;
  maxMembers: number;
  currentMembers: number;
  memberCount?: number;
  description?: string;
  isActive: boolean;
  isJoined?: boolean;
  createdAt: string;
}

export interface CreateGroupRequest {
  name: string;
  skillId: number;
  maxMembers: number;
  description?: string;
}

export interface GroupPageResponse {
  content: Group[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}
