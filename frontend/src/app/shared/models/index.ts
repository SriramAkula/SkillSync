// ─── Generic API wrapper ───────────────────────────────────────────────────
export interface ApiResponse<T> {
  message: string;
  data: T;
  statusCode?: number;
  success?: boolean;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  roles: string[];
  userId?: number;
  email?: string;
  username?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface OtpRequest { email: string; }
export interface OtpVerifyRequest { email: string; otp: string; }
export interface ResetPasswordRequest { email: string; newPassword: string; }
export interface GoogleTokenRequest { idToken: string; }

// ─── User Profile ──────────────────────────────────────────────────────────
export interface UserProfileDto {
  userId: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  skills?: string;
  createdAt?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  name?: string;
  bio?: string;
  phoneNumber?: string;
  skills?: string;
}

// ─── Mentor ────────────────────────────────────────────────────────────────
export type MentorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';

export interface MentorProfileDto {
  id: number;
  userId: number;
  name?: string; // Enriched in frontend
  username?: string; // Enriched in frontend
  user?: UserProfileDto; // Full enriched profile
  status: MentorStatus;
  isApproved: boolean;
  specialization: string;
  yearsOfExperience: number;
  hourlyRate: number;
  availabilityStatus: AvailabilityStatus;
  rating: number;
  totalStudents: number;
  approvalDate?: string;
  createdAt: string;
}

export interface ApplyMentorRequest {
  specialization: string;
  yearsOfExperience: number;
  hourlyRate: number;
  bio: string;
}

export interface UpdateAvailabilityRequest {
  availabilityStatus: AvailabilityStatus;
}

// ─── Session ───────────────────────────────────────────────────────────────
export type SessionStatus =
  | 'REQUESTED' | 'ACCEPTED' | 'REJECTED'
  | 'CANCELLED' | 'CONFIRMED' | 'PAYMENT_FAILED' | 'REFUNDED';

export interface SessionDto {
  id: number;
  mentorId: number;
  learnerId: number;
  skillId: number;
  mentorName?: string; // Enriched in frontend
  learnerName?: string; // Enriched in frontend
  skillName?: string; // Enriched in frontend
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestSessionRequest {
  mentorId: number;
  skillId: number;
  scheduledAt: string;
  durationMinutes: number;
}

// ─── Review ────────────────────────────────────────────────────────────────
export interface ReviewDto {
  id: number;
  learnerId: number;
  mentorId: number;
  sessionId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SubmitReviewRequest {
  mentorId: number;
  sessionId: number;
  rating: number;
  comment: string;
}

export interface MentorRatingDto {
  mentorId: number;
  averageRating: number;
  totalReviews: number;
}

// ─── Group ─────────────────────────────────────────────────────────────────
export interface GroupDto {
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

// ─── Notification ──────────────────────────────────────────────────────────
export interface NotificationDto {
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Payment ───────────────────────────────────────────────────────────────
export type SagaStatus =
  | 'INITIATED' | 'PAYMENT_PENDING' | 'PAYMENT_PROCESSING'
  | 'COMPLETED' | 'FAILED' | 'REFUND_INITIATED'
  | 'REFUNDED' | 'REJECTED' | 'COMPENSATION_FAILED';

export interface SagaResponse {
  id: number;
  correlationId: string;
  sessionId: number;
  mentorId: number;
  learnerId: number;
  amount?: number;
  hourlyRate?: number;
  durationMinutes?: number;
  status: SagaStatus;
  paymentReference?: string;
  refundReference?: string;
  failureReason?: string;
}

export interface StartSagaRequest {
  sessionId: number;
  mentorId: number;
  learnerId: number;
  durationMinutes: number;
}

export interface VerifyPaymentRequest {
  sessionId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// ─── Messaging ─────────────────────────────────────────────────────────────
export type MessageType = 'CHAT' | 'JOIN' | 'LEAVE';

export interface ChatMessage {
  id?: number;
  senderId: number;
  receiverId?: number; // Backend uses receiverId
  recipientId?: number; // For backward compatibility
  groupId?: number;
  content: string;
  createdAt?: string; // Backend uses createdAt
  timestamp?: string; // For backward compatibility
  type: MessageType;
  isRead?: boolean;
}

export * from './skill.models';
export * from './page.models';
