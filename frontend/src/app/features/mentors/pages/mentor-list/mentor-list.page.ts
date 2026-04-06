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
  template: `
    <div class="page">
      <!-- Hero -->
      <div class="hero">
        <div class="hero-text">
          <h1>Find Your Perfect Mentor</h1>
          <p>Connect with industry experts and accelerate your career</p>
        </div>
        <form [formGroup]="filterForm">
          <div class="search-bar">
            <span class="material-icons search-icon">auto_stories</span>
            <select formControlName="skill" class="search-input skill-select">
              <option value="">All Skills / Specializations</option>
              @for (cat of skillStore.groupedByCategory(); track cat.category) {
                <optgroup [label]="cat.category">
                  @for (s of cat.skills; track s.id) {
                    <option [value]="s.name">{{ s.name }}</option>
                  }
                </optgroup>
              }
            </select>
            @if (filterForm.value.skill) {
              <button type="button" class="icon-btn clear-btn" (click)="filterForm.patchValue({ skill: '' })">
                <span class="material-icons">close</span>
              </button>
            }
            <div class="divider-v"></div>
            <button type="button" class="icon-btn filter-toggle" [class.active]="isFilterOpen()" (click)="isFilterOpen.set(!isFilterOpen())" title="Advanced Filters">
              <span class="material-icons">tune</span>
              <span class="filter-lbl">Filters</span>
            </button>
          </div>

          @if (isFilterOpen()) {
            <div class="advanced-filters">
              <div class="filter-group">
                <label>Experience (Years)</label>
                <div class="range-inputs">
                  <input type="number" formControlName="minExperience" placeholder="Min" min="0" />
                  <span class="dash">-</span>
                  <input type="number" formControlName="maxExperience" placeholder="Max" min="0" />
                </div>
              </div>
              
              <div class="filter-group">
                <label>Max Hourly Rate ($)</label>
                <input type="number" formControlName="maxRate" placeholder="Any" min="0" />
              </div>

              <div class="filter-group">
                <label>Minimum Rating</label>
                <select formControlName="minRating" class="rating-select">
                  <option [ngValue]="null">Any</option>
                  <option [ngValue]="4.5">4.5+ ⭐</option>
                  <option [ngValue]="4.0">4.0+ ⭐</option>
                  <option [ngValue]="3.0">3.0+ ⭐</option>
                </select>
              </div>
            </div>
          }
        </form>

        <div class="filter-chips">
          @for (f of filters; track f.value) {
            <button class="chip" [class.active]="availFilter() === f.value" (click)="availFilter.set(f.value)">
              {{ f.label }}
            </button>
          }
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-num">{{ mentorStore.approvedCount() }}</span>
          <span class="stat-lbl">Mentors</span>
        </div>
        <div class="divider-v"></div>
        <div class="stat-item">
          <span class="stat-num">{{ filteredMentors().length }}</span>
          <span class="stat-lbl">Showing</span>
        </div>
      </div>

      <!-- Loading -->
      @if (mentorStore.loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48" />
          <p>Finding mentors for you...</p>
        </div>
      }

      <!-- Error -->
      @if (mentorStore.error()) {
        <div class="error-banner">
          <span class="material-icons">error_outline</span>
          {{ mentorStore.error() }}
        </div>
      }

      <!-- Grid -->
      @if (!mentorStore.loading()) {
        <div class="mentor-grid">
          @for (mentor of filteredMentors(); track mentor.id) {
            <app-mentor-card 
              [mentor]="mentor" 
              [overrideRating]="mentor.userId === authStore.userId() ? myRating() : undefined"
              [overrideLearnersCount]="mentor.userId === authStore.userId() ? myReviews().length : undefined"
              (view)="goToDetail($event)" 
              (book)="goToBook($event)" />
          }
          @empty {
            <div class="empty-state">
              <div class="empty-icon"><span class="material-icons">search_off</span></div>
              <h3>No mentors found</h3>
              <p>Try a different skill or remove filters</p>
              <button class="btn-reset" (click)="reset()">Clear Search</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
    @media (min-width: 640px) { .page { padding: 0 1.5rem; } }
    @media (min-width: 1024px) { .page { padding: 0 2rem; } }

    .hero {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; color: white;
    }
    @media (min-width: 640px) { .hero { padding: 2rem; } }
    @media (min-width: 1024px) { .hero { padding: 2.5rem; } }

    .hero-text h1 { font-size: 1.5rem; font-weight: 800; margin: 0 0 0.5rem; letter-spacing: -0.5px; }
    @media (min-width: 640px) { .hero-text h1 { font-size: 1.875rem; } }
    @media (min-width: 1024px) { .hero-text h1 { font-size: 2rem; } }

    .hero-text p { font-size: 0.875rem; opacity: 0.85; margin: 0 0 1.5rem; }
    @media (min-width: 640px) { .hero-text p { font-size: 1rem; } }
    @media (min-width: 1024px) { .hero-text p { font-size: 1rem; } }

    .search-bar {
      display: flex; align-items: center; gap: 0.75rem;
      background: white; border-radius: 0.875rem; padding: 0 1rem;
      height: 3rem; margin-bottom: 1rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    @media (min-width: 640px) { .search-bar { height: 3.5rem; padding: 0 1rem; } }

    .search-icon { color: #9ca3af; font-size: 1.375rem; }
    .search-input { flex: 1; border: none; outline: none; font-size: 0.875rem; color: #111827; background: transparent; }
    @media (min-width: 640px) { .search-input { font-size: 1rem; } }

    .skill-select { cursor: pointer; appearance: none; -webkit-appearance: none; }
    .search-input::placeholder { color: #9ca3af; }
    
    .icon-btn { background: none; border: none; cursor: pointer; color: #6b7280; display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.625rem; border-radius: 0.5rem; transition: background 0.15s, color 0.15s; font-size: 0.875rem; }
    @media (min-width: 640px) { .icon-btn { font-size: 1rem; padding: 0.5rem 0.75rem; } }

    .icon-btn:hover { background: #f3f4f6; color: #111827; }
    .clear-btn .material-icons { font-size: 1.125rem; }
    
    .filter-toggle.active { background: #eef2ff; color: #4f46e5; font-weight: 600; }
    .filter-lbl { font-size: 0.875rem; font-weight: 500; }
    @media (min-width: 640px) { .filter-lbl { font-size: 0.875rem; } }
    
    .advanced-filters { display: grid; grid-template-columns: 1fr; gap: 1rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 1rem; border-radius: 0.875rem; margin-bottom: 1.25rem; animation: slideDown 0.2s ease-out; }
    @media (min-width: 640px) { .advanced-filters { grid-template-columns: repeat(2, 1fr); padding: 1.25rem; } }
    @media (min-width: 1024px) { .advanced-filters { grid-template-columns: repeat(3, 1fr); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .filter-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .filter-group label { font-size: 0.8125rem; font-weight: 600; color: rgba(255,255,255,0.9); }
    .advanced-filters input, .advanced-filters select { height: 2.625rem; border-radius: 0.625rem; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.9); padding: 0 0.75rem; font-size: 0.875rem; color: #111827; outline: none; transition: border-color 0.15s; }
    @media (min-width: 640px) { .advanced-filters input, .advanced-filters select { font-size: 0.875rem; } }
    .advanced-filters input:focus, .advanced-filters select:focus { border-color: #4f46e5; }
    .range-inputs { display: flex; align-items: center; gap: 0.625rem; }
    .range-inputs input { width: 100%; }
    .dash { color: white; font-weight: 600; }
    .rating-select { cursor: pointer; appearance: none; }

    .filter-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .chip {
      padding: 0.375rem 1rem; border-radius: 1.25rem; border: 1.5px solid rgba(255,255,255,0.4);
      background: rgba(255,255,255,0.1); color: white;
      font-size: 0.8125rem; font-weight: 500; cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .chip:hover { background: rgba(255,255,255,0.2); }
    .chip.active { background: white; color: #4f46e5; border-color: white; font-weight: 600; }

    .stats-bar {
      display: flex; align-items: center; gap: 1.25rem;
      background: white; border-radius: 0.75rem; padding: 1rem 1.5rem;
      border: 1px solid #e5e7eb; margin-bottom: 1.5rem;
    }
    @media (min-width: 640px) { .stats-bar { gap: 1.5rem; padding: 1rem 1.5rem; } }

    .stat-item { display: flex; align-items: baseline; gap: 0.375rem; }
    .stat-num { font-size: 1.375rem; font-weight: 800; color: #4f46e5; }
    @media (min-width: 640px) { .stat-num { font-size: 1.5rem; } }

    .stat-lbl { font-size: 0.8125rem; color: #6b7280; }
    @media (min-width: 640px) { .stat-lbl { font-size: 0.8125rem; } }

    .divider-v { width: 1px; height: 1.5rem; background: #e5e7eb; }

    .mentor-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    @media (min-width: 640px) { .mentor-grid { grid-template-columns: repeat(2, 1fr); gap: 1.25rem; } }
    @media (min-width: 1024px) { .mentor-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; } }

    .loading-center { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem 1.25rem; color: #6b7280; }
    @media (min-width: 640px) { .loading-center { padding: 5rem 1.5rem; } }

    .error-banner { display: flex; align-items: center; gap: 0.625rem; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 0.875rem 1.125rem; border-radius: 0.75rem; margin-bottom: 1.25rem; font-size: 0.875rem; }
    @media (min-width: 640px) { .error-banner { padding: 1rem 1.25rem; font-size: 0.875rem; } }

    .error-banner .material-icons { font-size: 1.25rem; }

    .empty-state {
      grid-column: 1/-1; display: flex; flex-direction: column;
      align-items: center; padding: 3rem 1.25rem; gap: 0.75rem;
    }
    @media (min-width: 640px) { .empty-state { padding: 5rem 1.25rem; } }

    .empty-icon { width: 4.5rem; height: 4.5rem; border-radius: 1.25rem; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
    .empty-icon .material-icons { font-size: 36px; color: #9ca3af; }
    .empty-state h3 { font-size: 18px; font-weight: 700; color: #111827; margin: 0; }
    .empty-state p { color: #6b7280; font-size: 14px; margin: 0; }
    .btn-reset { padding: 10px 20px; border-radius: 10px; background: #4f46e5; color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 4px; }

    @media (max-width: 768px) {
      .hero { padding: 24px; }
      .hero-text h1 { font-size: 24px; }
    }
  `]
})
export class MentorListPage implements OnInit, OnDestroy {
  readonly mentorStore = inject(MentorStore);
  readonly skillStore = inject(SkillStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authStore = inject(AuthStore);
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
