import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ReviewService } from '../../../../core/services/review.service';
import { ReviewDto, MentorRatingDto } from '../../../../shared/models';

@Component({
  selector: 'app-mentor-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mentor-detail.page.html',
  styleUrl: './mentor-detail.page.scss'
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
    this.reviewService.getMentorReviews(id, 0, 5).subscribe(r => this.reviews.set(r.data.content));
    this.reviewService.getMentorRating(id).subscribe(r => this.rating.set(r.data));
  }

  isOwnProfile(mentorUserId: number): boolean {
    const myId = this.authStore.userId();
    return myId !== null && Number(myId) === Number(mentorUserId);
  }

  statusClasses(status: string): { bg: string; text: string } {
    const map: Record<string, { bg: string; text: string }> = {
      'AVAILABLE': { bg: 'bg-emerald-500 shadow-emerald-50', text: 'text-emerald-600' },
      'BUSY': { bg: 'bg-amber-500 shadow-amber-50', text: 'text-amber-600' },
      'UNAVAILABLE': { bg: 'bg-slate-300', text: 'text-slate-400' }
    };
    return map[status] || map['UNAVAILABLE'];
  }

  bookSession(mentorId: number): void { this.router.navigate(['/sessions/request'], { queryParams: { mentorId } }); }
  
  openChat(mentor: { userId: number; name?: string; username?: string }): void {
    if (!mentor?.userId) return;
    this.router.navigate(['/messages'], { queryParams: { tab: 'direct', directUserId: mentor.userId } });
  }

  initials(name: string): string { return (name || 'M').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
}
