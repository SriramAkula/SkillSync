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
  templateUrl: './mentor-reviews.page.html',
  styleUrl: './mentor-reviews.page.scss'
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
