export interface AdminUserProfile {
  id: number;
  userId: number;
  username: string;
  email: string;
  name: string;
  bio: string;
  phoneNumber: string;
  profileImageUrl: string;
  skills: string;
  rating: number;
  totalReviews: number;
  isProfileComplete: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
  isBlocked: boolean;
  blockReason: string;
  blockDate: string;
  blockedBy: number;
}

export interface AdminStats {
  totalUsers: number;
  totalMentors: number;
  totalSessions: number;
  pendingApplications: number;
  totalRevenue: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
