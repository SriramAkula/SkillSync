import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MentorProfileDto } from '../../../../shared/models';
import { AuthStore } from '../../../../core/auth/auth.store';
import { MessagingService } from '../../../../core/services/messaging.service';
import { ReviewService } from '../../../../core/services/review.service';
import { OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-mentor-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mentor-card.component.html',
  styleUrl: './mentor-card.component.scss'
})
export class MentorCardComponent implements OnInit {
  @Input({ required: true }) mentor!: MentorProfileDto;
  @Input() overrideRating?: number; // Pass loaded rating for current user
  @Input() overrideLearnersCount?: number; // Pass learners count for current user
  @Output() view = new EventEmitter<number>();
  @Output() book = new EventEmitter<number>();

  private readonly authStore = inject(AuthStore);
  private readonly messagingService = inject(MessagingService);
  private readonly reviewService = inject(ReviewService);

  readonly enrichedRating = signal<number | null>(null);
  readonly enrichedReviewCount = signal<number | null>(null);

  ngOnInit(): void {
    // Enrich card with real-time rating and review count from review-service
    this.reviewService.getMentorRating(this.mentor.userId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.enrichedRating.set(res.data.averageRating);
          this.enrichedReviewCount.set(res.data.totalReviews);
        }
      },
      error: (err) => console.warn(`Failed to enrich ratings for mentor ${this.mentor.id}`, err)
    });
  }

  openChat(): void {
    const name = this.mentor.user?.name || this.mentor.user?.username || 'Mentor';
    this.messagingService.openPrivateChat(this.mentor.userId, name);
  }

  // Use method instead of computed() — @Input is not available at computed() init time
  isOwnProfile(): boolean {
    const myId = this.authStore.userId();
    return myId !== null && Number(myId) === Number(this.mentor.userId);
  }

  initials(): string {
    const name = this.mentor.name || this.mentor.username || this.mentor.specialization || '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
