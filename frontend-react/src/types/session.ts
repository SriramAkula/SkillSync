export interface Session {
  id: number;
  mentorId: number;
  learnerId: number;
  title: string;
  skillId: number;
  description?: string;
  scheduledAt: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'CONFIRMED' | 'PAYMENT_FAILED' | 'REFUNDED' | 'COMPLETED';
  amount: number;
  currency: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  meetingLink?: string;
  notes?: string;
  rejectionReason?: string;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;

  // Joined from backend
  mentorName?: string;
  learnerName?: string;
}

export interface SessionSearchParams {
  page?: number;
  size?: number;
}
