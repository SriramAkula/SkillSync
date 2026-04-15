import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReviewService } from './review.service';
import { environment } from '../../../environments/environment';
import { SubmitReviewRequest } from '../../shared/models';

describe('ReviewService', () => {
  let service: ReviewService;
  let httpMock: HttpTestingController;
  const mockApiUrl = `${environment.apiUrl}/review`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReviewService]
    });
    service = TestBed.inject(ReviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should submit a review', () => {
    const mockRequest = { mentorId: 1, sessionId: 101, rating: 5, comment: 'Great mentor!' };
    service.submitReview(mockRequest as SubmitReviewRequest).subscribe();

    const req = httpMock.expectOne(mockApiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush({ success: true });
  });

  it('should fetch mentor reviews with pagination', () => {
    const mentorId = 1;
    service.getMentorReviews(mentorId, 1, 10).subscribe();

    const req = httpMock.expectOne(r => 
      r.url.includes(`/mentors/${mentorId}`) && 
      r.params.get('page') === '1' && 
      r.params.get('size') === '10'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { content: [] } });
  });

  it('should get mentor rating', () => {
    const mentorId = 1;
    const mockResponse = { data: { mentorId: 1, averageRating: 4.5, totalReviews: 10 } };
    
    service.getMentorRating(mentorId).subscribe(res => {
      expect(res.data.averageRating).toBe(4.5);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/mentors/${mentorId}/rating`);
    req.flush(mockResponse);
  });

  it('should update and delete reviews', () => {
    const reviewId = 99;
    const updateReq = { rating: 4, comment: 'Updated' };

    service.updateReview(reviewId, updateReq as SubmitReviewRequest).subscribe();
    const putReq = httpMock.expectOne(`${mockApiUrl}/${reviewId}`);
    expect(putReq.request.method).toBe('PUT');
    putReq.flush({ success: true });

    service.deleteReview(reviewId).subscribe();
    const deleteReq = httpMock.expectOne(`${mockApiUrl}/${reviewId}`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({ success: true });
  });
});
