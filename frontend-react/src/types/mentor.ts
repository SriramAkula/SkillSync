import type { UserProfile } from './auth';

export interface MentorProfile {
  id: number;
  userId: number;
  user?: UserProfile;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isApproved: boolean;
  specialization: string;
  yearsOfExperience: number;
  hourlyRate: number;
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  bio: string;
  rating: number;
  totalStudents: number;
  // Included from UserProfile joined in backend
  name?: string;
  username?: string;
  profilePictureUrl?: string;
}

export interface MentorSearchParams {
  skill?: string | null;
  minExperience?: number | null;
  maxExperience?: number | null;
  maxRate?: number | null;
  minRating?: number | null;
  page?: number;
  size?: number;
}
