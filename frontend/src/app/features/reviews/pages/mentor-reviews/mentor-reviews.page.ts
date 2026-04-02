import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReviewService } from '../../../../core/services/review.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ReviewDto, MentorRatingDto } from '../../../../shared/models';

@Component({
  selector: 'app-mentor-reviews-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">
      <button class="back-btn" (click)="router.navigate(['/mentors', mentorId()])">
        <span class="material-icons">arrow_back</span> Mentor Profile
      </button>

      <div class="page-header">
        <h1>Reviews</h1>
        @if (rating(); as r) {
          <div class="rating-summary">
            <div class="big-rating">{{ r.averageRating | number:'1.1-1' }}</div>
            <div class="rating-details">
              <div class="stars-row">{{ starString(r.averageRating) }}</div>
              <div class="review-count">{{ r.totalReviews }} reviews</div>
            </div>
          </div>
        }
      </div>

      <!-- Submit Review Form (learners only) -->
      @if (authStore.isLearner()) {
        <div class="review-form-card">
          <h3>Write a Review</h3>
          <p>Share your experience with this mentor</p>

          <div class="form">
            <div class="input-group">
              <label class="input-label">Session ID <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="material-icons input-icon">event</span>
                <input type="number" [(ngModel)]="newReview.sessionId" placeholder="Your session ID" />
              </div>
            </div>

            <div class="input-group">
              <label class="input-label">Rating <span class="required">*</span></label>
              <div class="star-picker">
                @for (i of [1,2,3,4,5]; track i) {
                  <button type="button" class="star-btn" [class.active]="newReview.rating >= i"
                          (click)="newReview.rating = i" (mouseenter)="hoverRating.set(i)" (mouseleave)="hoverRating.set(0)">
                    <span class="material-icons">{{ (hoverRating() || newReview.rating) >= i ? 'star' : 'star_border' }}</span>
                  </button>
                }
                <span class="rating-label">{{ ratingLabel(hoverRating() || newReview.rating) }}</span>
              </div>
            </div>

            <div class="input-group">
              <label class="input-label">Comment <span class="required">*</span></label>
              <div class="input-wrapper textarea-wrap">
                <textarea [(ngModel)]="newReview.comment" placeholder="Describe your experience..." rows="4"></textarea>
              </div>
            </div>

            <button class="btn-submit" (click)="submitReview()"
                    [disabled]="!newReview.sessionId || !newReview.rating || !newReview.comment || submitting()">
              @if (submitting()) { <mat-spinner diameter="20" /> }
              @else { <span class="material-icons">rate_review</span> Submit Review }
            </button>
          </div>
        </div>
      }

      <!-- Reviews List -->
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <div class="reviews-list">
          @for (r of reviews(); track r.id) {
            <div class="review-card">
              <div class="review-top">
                <div class="reviewer-avatar">L</div>
                <div class="reviewer-info">
                  <div class="stars-row">{{ starString(r.rating) }}</div>
                  <div class="review-date">{{ r.createdAt | date:'MMM d, y' }}</div>
                </div>
                @if (r.learnerId === authStore.userId()) {
                  <div class="review-actions">
                    <button class="btn-edit" (click)="startEdit(r)">
                      <span class="material-icons">edit</span>
                    </button>
                    <button class="btn-delete" (click)="deleteReview(r.id)">
                      <span class="material-icons">delete</span>
                    </button>
                  </div>
                }
              </div>
              @if (editingId() === r.id) {
                <div class="edit-form">
                  <div class="input-wrapper textarea-wrap">
                    <textarea [(ngModel)]="editComment" rows="3"></textarea>
                  </div>
                  <div class="edit-actions">
                    <button class="btn-cancel-edit" (click)="editingId.set(null)">Cancel</button>
                    <button class="btn-save-edit" (click)="saveEdit(r)">Save</button>
                  </div>
                </div>
              } @else {
                <p class="review-text">{{ r.comment }}</p>
              }
            </div>
          }
          @empty {
            <div class="empty-state">
              <div class="empty-icon"><span class="material-icons">rate_review</span></div>
              <h3>No reviews yet</h3>
              <p>Be the first to review this mentor!</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 760px; margin: 0 auto; }
    .back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: var(--text-secondary); font-size: 14px; font-weight: 500; cursor: pointer; padding: 8px 0; margin-bottom: 20px; transition: color 0.15s; }
    .back-btn:hover { color: var(--primary); }
    .back-btn .material-icons { font-size: 18px; }

    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
    .page-header h1 { font-size: 28px; font-weight: 800; color: var(--text); margin: 0; }
    .rating-summary { display: flex; align-items: center; gap: 16px; background: var(--warning-bg); padding: 12px 20px; border-radius: 14px; border: 1px solid var(--border); }
    .big-rating { font-size: 36px; font-weight: 800; color: #d97706; }
    .stars-row { color: #f59e0b; font-size: 18px; letter-spacing: 2px; }
    .review-count { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

    .review-form-card { background: var(--surface); border-radius: 20px; border: 1px solid var(--border); padding: 24px; margin-bottom: 28px; box-shadow: var(--shadow-sm); }
    .review-form-card h3 { font-size: 18px; font-weight: 700; color: var(--text); margin: 0 0 4px; }
    .review-form-card p { font-size: 14px; color: var(--text-secondary); margin: 0 0 20px; }
    .form { display: flex; flex-direction: column; gap: 16px; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-label { font-size: 13px; font-weight: 600; color: var(--text); }
    .required { color: var(--error); }
    .input-wrapper { background: var(--surface-alt); border: 1.5px solid var(--border); border-radius: 12px; padding: 0 14px; height: 52px; display: flex; align-items: center; transition: border-color 0.2s; }
    .input-wrapper:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-muted); background: var(--surface); }
    .input-icon { font-size: 18px; color: var(--text-muted); margin-right: 10px; }
    .input-wrapper input { flex: 1; border: none; outline: none; font-size: 15px; color: var(--text); background: transparent; }
    .textarea-wrap { height: auto; padding: 12px 14px; align-items: flex-start; }
    .textarea-wrap textarea { flex: 1; border: none; outline: none; font-size: 14px; color: var(--text); background: transparent; resize: none; font-family: inherit; width: 100%; }

    .star-picker { display: flex; align-items: center; gap: 4px; }
    .star-btn { background: none; border: none; cursor: pointer; padding: 2px; transition: transform 0.1s; }
    .star-btn:hover { transform: scale(1.2); }
    .star-btn .material-icons { font-size: 28px; color: var(--border-strong); transition: color 0.15s; }
    .star-btn.active .material-icons { color: #f59e0b; }
    .rating-label { font-size: 13px; color: var(--text-secondary); margin-left: 8px; font-weight: 500; }

    .btn-submit { height: 48px; border-radius: 12px; background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: var(--shadow-primary); transition: opacity 0.2s; }
    .btn-submit:hover:not(:disabled) { opacity: 0.9; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-submit .material-icons { font-size: 18px; }

    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .reviews-list { display: flex; flex-direction: column; gap: 14px; }
    .review-card { background: var(--surface); border-radius: 16px; border: 1px solid var(--border); padding: 20px; transition: box-shadow .15s; }
    .review-card:hover { box-shadow: var(--shadow-md); }
    .review-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .reviewer-avatar { width: 40px; height: 40px; border-radius: 12px; background: var(--primary-light); color: var(--primary); font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .reviewer-info { flex: 1; }
    .review-date { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
    .review-text { font-size: 14px; color: var(--text); margin: 0; line-height: 1.6; }
    .review-actions { display: flex; gap: 4px; margin-left: auto; }
    .btn-edit, .btn-delete { width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-edit { background: var(--primary-light); color: var(--primary); }
    .btn-delete { background: var(--error-bg); color: var(--error); }
    .btn-edit .material-icons, .btn-delete .material-icons { font-size: 16px; }
    .edit-form { display: flex; flex-direction: column; gap: 10px; }
    .edit-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-cancel-edit { height: 36px; padding: 0 14px; border-radius: 8px; background: var(--surface-alt); color: var(--text); border: 1px solid var(--border); font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-save-edit { height: 36px; padding: 0 14px; border-radius: 8px; background: var(--primary); color: white; border: none; font-size: 13px; font-weight: 600; cursor: pointer; }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px; }
    .empty-icon { width: 64px; height: 64px; border-radius: 18px; background: var(--surface-alt); display: flex; align-items: center; justify-content: center; }
    .empty-icon .material-icons { font-size: 32px; color: var(--text-muted); }
    .empty-state h3 { font-size: 16px; font-weight: 700; color: var(--text); margin: 0; }
    .empty-state p { font-size: 13px; color: var(--text-secondary); margin: 0; }
  `]
})
export class MentorReviewsPage implements OnInit {
  private readonly reviewService = inject(ReviewService);
  private readonly route = inject(ActivatedRoute);
  private readonly snack = inject(MatSnackBar);
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);

  readonly reviews = signal<ReviewDto[]>([]);
  readonly rating = signal<MentorRatingDto | null>(null);
  readonly mentorId = signal(0);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly hoverRating = signal(0);

  newReview = { sessionId: null as number | null, rating: 0, comment: '' };
  editComment = '';

  readonly ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  ratingLabel(r: number): string { return this.ratingLabels[r] ?? ''; }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('mentorId'));
    this.mentorId.set(id);
    this.reviewService.getMentorReviews(id).subscribe({ next: (r) => { this.reviews.set(r.data ?? []); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.reviewService.getMentorRating(id).subscribe({ next: (r) => this.rating.set(r.data), error: () => {} });
  }

  submitReview(): void {
    if (!this.newReview.sessionId || !this.newReview.rating || !this.newReview.comment) return;
    this.submitting.set(true);
    this.reviewService.submitReview({ mentorId: this.mentorId(), sessionId: this.newReview.sessionId!, rating: this.newReview.rating, comment: this.newReview.comment }).subscribe({
      next: (r) => {
        this.reviews.update(list => [r.data, ...list]);
        this.newReview = { sessionId: null, rating: 0, comment: '' };
        this.submitting.set(false);
        this.snack.open('Review submitted!', 'OK', { duration: 3000 });
        this.reviewService.getMentorRating(this.mentorId()).subscribe(r => this.rating.set(r.data));
      },
      error: (e) => { this.submitting.set(false); this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 }); }
    });
  }

  startEdit(r: ReviewDto): void { this.editingId.set(r.id); this.editComment = r.comment; }

  saveEdit(r: ReviewDto): void {
    this.reviewService.updateReview(r.id, { mentorId: r.mentorId, sessionId: r.sessionId, rating: r.rating, comment: this.editComment }).subscribe({
      next: (res) => { this.reviews.update(list => list.map(x => x.id === r.id ? res.data : x)); this.editingId.set(null); this.snack.open('Review updated!', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 })
    });
  }

  deleteReview(id: number): void {
    this.reviewService.deleteReview(id).subscribe({
      next: () => { this.reviews.update(list => list.filter(r => r.id !== id)); this.snack.open('Review deleted.', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 })
    });
  }

  starString(r: number): string { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)); }
}
