import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ReviewDto, SubmitReviewRequest, MentorRatingDto } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/review`;

  submitReview(req: SubmitReviewRequest): Observable<ApiResponse<ReviewDto>> {
    return this.http.post<ApiResponse<ReviewDto>>(this.base, req);
  }

  getReview(id: number): Observable<ApiResponse<ReviewDto>> {
    return this.http.get<ApiResponse<ReviewDto>>(`${this.base}/${id}`);
  }

  getMentorReviews(mentorId: number): Observable<ApiResponse<ReviewDto[]>> {
    return this.http.get<ApiResponse<ReviewDto[]>>(`${this.base}/mentors/${mentorId}`);
  }

  getMentorRating(mentorId: number): Observable<ApiResponse<MentorRatingDto>> {
    return this.http.get<ApiResponse<MentorRatingDto>>(`${this.base}/mentors/${mentorId}/rating`);
  }

  updateReview(id: number, req: SubmitReviewRequest): Observable<ApiResponse<ReviewDto>> {
    return this.http.put<ApiResponse<ReviewDto>>(`${this.base}/${id}`, req);
  }

  deleteReview(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
}
