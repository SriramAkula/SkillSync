export interface Review {
  id: number;
  mentorId: number;
  learnerId: number;
  sessionId: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  learnerName?: string;
  username?: string;
}

export interface SubmitReviewRequest {
  mentorId: number;
  sessionId: number;
  rating: number;
  comment: string;
}

export interface MentorRating {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}
