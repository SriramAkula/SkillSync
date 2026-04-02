import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { SkillStore } from '../../../../core/auth/skill.store';
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
            <app-mentor-card [mentor]="mentor" (view)="goToDetail($event)" (book)="goToBook($event)" />
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
    .page { max-width: 1200px; margin: 0 auto; }

    .hero {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border-radius: 20px; padding: 40px; margin-bottom: 24px; color: white;
    }
    .hero-text h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.5px; }
    .hero-text p { font-size: 16px; opacity: 0.85; margin: 0 0 24px; }

    .search-bar {
      display: flex; align-items: center; gap: 12px;
      background: white; border-radius: 14px; padding: 0 16px;
      height: 56px; margin-bottom: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .search-icon { color: #9ca3af; font-size: 22px; }
    .search-input { flex: 1; border: none; outline: none; font-size: 16px; color: #111827; background: transparent; }
    .skill-select { cursor: pointer; appearance: none; -webkit-appearance: none; }
    .search-input::placeholder { color: #9ca3af; }
    
    .icon-btn { background: none; border: none; cursor: pointer; color: #6b7280; display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; transition: background 0.15s, color 0.15s; }
    .icon-btn:hover { background: #f3f4f6; color: #111827; }
    .clear-btn .material-icons { font-size: 18px; }
    
    .filter-toggle.active { background: #eef2ff; color: #4f46e5; font-weight: 600; }
    .filter-lbl { font-size: 14px; font-weight: 500; }
    
    .advanced-filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 20px; border-radius: 14px; margin-bottom: 20px; animation: slideDown 0.2s ease-out; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .filter-group { display: flex; flex-direction: column; gap: 8px; }
    .filter-group label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9); }
    .advanced-filters input, .advanced-filters select { height: 42px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.9); padding: 0 12px; font-size: 14px; color: #111827; outline: none; transition: border-color 0.15s; }
    .advanced-filters input:focus, .advanced-filters select:focus { border-color: #4f46e5; }
    .range-inputs { display: flex; align-items: center; gap: 10px; }
    .range-inputs input { width: 100%; }
    .dash { color: white; font-weight: 600; }
    .rating-select { cursor: pointer; appearance: none; }

    .filter-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip {
      padding: 6px 16px; border-radius: 20px; border: 1.5px solid rgba(255,255,255,0.4);
      background: rgba(255,255,255,0.1); color: white;
      font-size: 13px; font-weight: 500; cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .chip:hover { background: rgba(255,255,255,0.2); }
    .chip.active { background: white; color: #4f46e5; border-color: white; font-weight: 600; }

    .stats-bar {
      display: flex; align-items: center; gap: 20px;
      background: var(--surface); border-radius: 12px; padding: 16px 24px;
      border: 1px solid var(--border); margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
    }
    .stat-item { display: flex; align-items: baseline; gap: 6px; }
    .stat-num { font-size: 22px; font-weight: 800; color: var(--primary); }
    .stat-lbl { font-size: 13px; color: var(--text-secondary); }
    .divider-v { width: 1px; height: 24px; background: var(--border); }

    .mentor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

    .loading-center { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px; color: var(--text-secondary); }

    .error-banner { display: flex; align-items: center; gap: 10px; background: var(--error-bg); color: var(--error); border: 1px solid var(--error-border); padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; }
    .error-banner .material-icons { font-size: 20px; }

    .empty-state {
      grid-column: 1/-1; display: flex; flex-direction: column;
      align-items: center; padding: 80px 20px; gap: 12px;
    }
    .empty-icon { width: 72px; height: 72px; border-radius: 20px; background: var(--surface-alt); display: flex; align-items: center; justify-content: center; }
    .empty-icon .material-icons { font-size: 36px; color: var(--text-muted); }
    .empty-state h3 { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
    .empty-state p { color: var(--text-secondary); font-size: 14px; margin: 0; }
    .btn-reset { padding: 10px 20px; border-radius: 10px; background: var(--primary); color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 4px; }

    @media (max-width: 768px) {
      .hero { padding: 24px; }
      .hero-text h1 { font-size: 24px; }
    }
  `]
})
export class MentorListPage implements OnInit {
  readonly mentorStore = inject(MentorStore);
  readonly skillStore = inject(SkillStore);
  private readonly router = inject(Router);

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

  ngOnInit(): void {
    this.mentorStore.loadApproved(undefined);
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }
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

  filteredMentors() {
    const avail = this.availFilter();
    
    // Check if any filter in form has a value
    const v = this.filterForm.value;
    const hasSearchActive = (v.skill && v.skill.length >= 2) || v.minExperience != null || v.maxExperience != null || v.maxRate != null || v.minRating != null;
    
    const list = hasSearchActive ? this.mentorStore.searchResults() : this.mentorStore.approved();
    return avail ? list.filter(m => m.availabilityStatus === avail) : list;
  }

  reset(): void { this.filterForm.reset(); this.availFilter.set(''); }
  goToDetail(id: number): void { this.router.navigate(['/mentors', id]); }
  goToBook(id: number): void { this.router.navigate(['/sessions/request'], { queryParams: { mentorId: id } }); }
}
