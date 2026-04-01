import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ReviewService } from '../../../../core/services/review.service';
import { ReviewDto, MentorRatingDto } from '../../../../shared/models';

@Component({
  selector: 'app-mentor-detail-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <button class="back-btn" (click)="router.navigate(['/mentors'])">
        <span class="material-icons">arrow_back</span> All Mentors
      </button>

      @if (mentorStore.loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      }

      @if (mentorStore.selected(); as mentor) {
        <div class="layout">

          <!-- Left: Profile -->
          <div class="profile-col">
            <div class="profile-card">
              <div class="avatar-xl">{{ initials(mentor.specialization) }}</div>
              <h2>{{ mentor.specialization }}</h2>
              <p class="exp-text">{{ mentor.yearsOfExperience }} years of experience</p>

              <div class="avail-badge" [class]="'avail-' + mentor.availabilityStatus.toLowerCase()">
                <span class="dot"></span>{{ mentor.availabilityStatus }}
              </div>

              <div class="stats-grid">
                <div class="stat-box">
                  <span class="stat-val">{{ mentor.rating | number:'1.1-1' }}</span>
                  <span class="stat-lbl">⭐ Rating</span>
                </div>
                <div class="stat-box">
                  <span class="stat-val">{{ mentor.totalStudents }}</span>
                  <span class="stat-lbl">👥 Students</span>
                </div>
                <div class="stat-box">
                  <span class="stat-val">₹{{ mentor.hourlyRate }}</span>
                  <span class="stat-lbl">💰 Per Hour</span>
                </div>
              </div>

              @if (isOwnProfile(mentor.userId)) {
                <div class="own-profile-note">
                  <span class="material-icons">info</span>
                  This is your mentor profile
                </div>
                <button class="btn-dashboard" (click)="router.navigate(['/mentor-dashboard'])">
                  <span class="material-icons">dashboard</span>
                  Go to Dashboard
                </button>
              } @else {
                <button class="book-btn" [disabled]="mentor.availabilityStatus !== 'AVAILABLE'" (click)="bookSession(mentor.id)">
                  <span class="material-icons">event</span>
                  Book a Session
                </button>
              }
            </div>
          </div>

          <!-- Right: Reviews -->
          <div class="reviews-col">
            <div class="reviews-header">
              <h3>Reviews</h3>
              @if (rating()) {
                <div class="rating-pill">
                  <span class="material-icons">star</span>
                  {{ rating()!.averageRating | number:'1.1-1' }}
                  <span class="review-count">({{ rating()!.totalReviews }})</span>
                </div>
              }
            </div>

            @for (r of reviews(); track r.id) {
              <div class="review-card">
                <div class="review-top">
                  <div class="reviewer-avatar">{{ 'L' }}</div>
                  <div>
                    <div class="stars">{{ starString(r.rating) }}</div>
                    <div class="review-date">{{ r.createdAt | date:'mediumDate' }}</div>
                  </div>
                </div>
                <p class="review-text">{{ r.comment }}</p>
              </div>
            }
            @empty {
              <div class="no-reviews">
                <span class="material-icons">rate_review</span>
                <p>No reviews yet. Be the first!</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; }
    .back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #6b7280; font-size: 14px; font-weight: 500; cursor: pointer; padding: 8px 0; margin-bottom: 24px; transition: color 0.15s; }
    .back-btn:hover { color: #4f46e5; }
    .back-btn .material-icons { font-size: 18px; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }

    .layout { display: grid; grid-template-columns: 300px 1fr; gap: 24px; }
    @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } }

    .profile-card {
      background: white; border-radius: 20px; border: 1px solid #e5e7eb;
      padding: 28px; display: flex; flex-direction: column; align-items: center; gap: 14px;
      position: sticky; top: 88px;
    }
    .avatar-xl {
      width: 88px; height: 88px; border-radius: 24px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; font-size: 32px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .profile-card h2 { font-size: 20px; font-weight: 800; color: #111827; margin: 0; text-align: center; }
    .exp-text { font-size: 13px; color: #6b7280; margin: 0; }

    .avail-badge { display: flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .dot { width: 7px; height: 7px; border-radius: 50%; }
    .avail-available { background: #dcfce7; color: #16a34a; }
    .avail-available .dot { background: #16a34a; }
    .avail-busy { background: #fef3c7; color: #d97706; }
    .avail-busy .dot { background: #d97706; }
    .avail-unavailable { background: #fee2e2; color: #dc2626; }
    .avail-unavailable .dot { background: #dc2626; }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; }
    .stat-box { background: #f9fafb; border-radius: 12px; padding: 12px 8px; text-align: center; border: 1px solid #e5e7eb; }
    .stat-val { display: block; font-size: 18px; font-weight: 800; color: #4f46e5; }
    .stat-lbl { font-size: 11px; color: #6b7280; margin-top: 2px; display: block; }

    .book-btn {
      width: 100%; height: 48px; border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; border: none; font-size: 15px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 15px rgba(79,70,229,0.3); transition: opacity 0.2s, transform 0.1s;
    }
    .book-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .book-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .book-btn .material-icons { font-size: 20px; }

    .own-profile-note {
      display: flex; align-items: center; gap: 6px;
      background: #eef2ff; color: #4f46e5;
      padding: 10px 14px; border-radius: 10px;
      font-size: 13px; font-weight: 500; width: 100%;
    }
    .own-profile-note .material-icons { font-size: 16px; }
    .btn-dashboard {
      width: 100%; height: 48px; border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; border: none; font-size: 15px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 15px rgba(79,70,229,0.3); transition: opacity 0.2s;
    }
    .btn-dashboard:hover { opacity: 0.9; }
    .btn-dashboard .material-icons { font-size: 20px; }

    .reviews-col { display: flex; flex-direction: column; gap: 16px; }
    .reviews-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .reviews-header h3 { font-size: 20px; font-weight: 800; color: #111827; margin: 0; }
    .rating-pill { display: flex; align-items: center; gap: 4px; background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 700; }
    .rating-pill .material-icons { font-size: 16px; }
    .review-count { font-weight: 400; color: #92400e; font-size: 13px; }

    .review-card { background: white; border-radius: 14px; border: 1px solid #e5e7eb; padding: 18px; }
    .review-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
    .reviewer-avatar { width: 36px; height: 36px; border-radius: 10px; background: #e0e7ff; color: #4f46e5; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stars { color: #f59e0b; font-size: 16px; letter-spacing: 1px; }
    .review-date { font-size: 12px; color: #9ca3af; margin-top: 2px; }
    .review-text { font-size: 14px; color: #374151; margin: 0; line-height: 1.6; }

    .no-reviews { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px; color: #9ca3af; background: white; border-radius: 14px; border: 1px solid #e5e7eb; }
    .no-reviews .material-icons { font-size: 40px; }
    .no-reviews p { margin: 0; font-size: 14px; }
  `]
})
export class MentorDetailPage implements OnInit {
  readonly mentorStore = inject(MentorStore);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly reviewService = inject(ReviewService);
  readonly reviews = signal<ReviewDto[]>([]);
  readonly rating = signal<MentorRatingDto | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.mentorStore.loadById(id);
    this.reviewService.getMentorReviews(id).subscribe(r => this.reviews.set(r.data));
    this.reviewService.getMentorRating(id).subscribe(r => this.rating.set(r.data));
  }

  isOwnProfile(mentorUserId: number): boolean {
    const myId = this.authStore.userId();
    return myId !== null && Number(myId) === Number(mentorUserId);
  }

  bookSession(mentorId: number): void { this.router.navigate(['/sessions/request'], { queryParams: { mentorId } }); }
  initials(s: string): string { return s.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
  starString(r: number): string { return '★'.repeat(r) + '☆'.repeat(5 - r); }
}
