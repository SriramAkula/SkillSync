export interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPageResponse {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
