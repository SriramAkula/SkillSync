import { Component, inject, OnInit, signal, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ReviewService } from '../../../../core/services/review.service';
import { MentorCardComponent } from '../../components/mentor-card/mentor-card.component';

@Component({
  selector: 'app-mentor-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule, MentorCardComponent],
  templateUrl: './mentor-list.page.html',
  styleUrl: './mentor-list.page.scss'
})
export class MentorListPage implements OnInit, OnDestroy {
  readonly mentorStore = inject(MentorStore);
  readonly skillStore = inject(SkillStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly authStore = inject(AuthStore);
  private readonly reviewService = inject(ReviewService);

  readonly isFilterOpen = signal(false);
  readonly filterForm = new FormGroup({
    skill: new FormControl(''),
    minExperience: new FormControl<number | null>(null),
    maxExperience: new FormControl<number | null>(null),
    maxRate: new FormControl<number | null>(null),
    minRating: new FormControl<number | null>(null)
  });

  readonly availFilter = signal('');
  readonly filters = [
    { label: 'All', value: '' },
    { label: '🟢 Available', value: 'AVAILABLE' },
    { label: '🟡 Busy', value: 'BUSY' },
  ];

  private routerSub: any;

  // Track current user's mentor rating and reviews
  readonly myRating = signal<number | null>(null);
  readonly myReviews = signal<any[]>([]);

  // Merge myProfile with approved list to always show latest data for current user
  readonly syncedApprovedMentors = computed(() => {
    const mentors = this.mentorStore.approved();
    const myProfile = this.mentorStore.myProfile();
    const myUserId = this.authStore.userId();

    if (!myProfile || !myUserId) {
      return mentors;
    }

    // Replace current user's stale profile with fresh myProfile
    return mentors.map(m => Number(m.userId) === Number(myUserId) ? myProfile : m);
  });

  ngOnInit(): void {
    this.loadMentors();
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }
    
    // Refresh mentors when navigating back to this page
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;
        // Match /mentors or /mentors?query but not /mentors/123 (detail page)
        if ((url === '/mentors' || url.startsWith('/mentors?')) && !url.match(/\/mentors\/\d+/)) {
          this.loadMentors();
        }
      });
    
    this.filterForm.valueChanges.pipe(debounceTime(400)).subscribe(vals => {
      const hasFilter = (vals.skill && vals.skill.length >= 2) ||
        vals.minExperience != null ||
        vals.maxExperience != null ||
        vals.maxRate != null ||
        vals.minRating != null;
      if (hasFilter) {
        this.mentorStore.search(vals as any);
      } else {
        this.mentorStore.loadApproved(undefined);
      }
    });
  }

  private loadMentors(): void {
    this.mentorStore.loadApproved(undefined);
    // Also refresh myProfile to sync updated mentor profile data
    this.mentorStore.loadMyProfile(undefined);
    
    // Load my rating and reviews if I'm a mentor
    const myId = this.authStore.userId();
    if (myId) {
      this.reviewService.getMentorReviews(Number(myId)).subscribe(res => {
        this.myReviews.set(res.data);
      });
      this.reviewService.getMentorRating(Number(myId)).subscribe(res => {
        this.myRating.set(res.data.averageRating);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  filteredMentors = computed(() => {
    const avail = this.availFilter();

    // Check if any filter in form has a value
    const v = this.filterForm.value;
    const hasSearchActive = (v.skill && v.skill.length >= 2) || v.minExperience != null || v.maxExperience != null || v.maxRate != null || v.minRating != null;

    // Use syncedApprovedMentors to always show updated myProfile data
    const list = hasSearchActive ? this.mentorStore.searchResults() : this.syncedApprovedMentors();
    return avail ? list.filter(m => m.availabilityStatus === avail) : list;
  });

  reset(): void { this.filterForm.reset(); this.availFilter.set(''); }
  goToDetail(id: number): void { this.router.navigate(['/mentors', id]); }
  goToBook(id: number): void { this.router.navigate(['/sessions/request'], { queryParams: { mentorId: id } }); }
}
