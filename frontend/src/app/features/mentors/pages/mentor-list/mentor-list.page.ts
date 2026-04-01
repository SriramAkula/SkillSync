import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MentorStore } from '../../../../core/auth/mentor.store';
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
        <div class="search-bar">
          <span class="material-icons search-icon">search</span>
          <input [formControl]="searchCtrl" placeholder="Search by skill — Java, React, AWS..." class="search-input" />
          @if (searchCtrl.value) {
            <button class="clear-btn" (click)="searchCtrl.setValue('')">
              <span class="material-icons">close</span>
            </button>
          }
        </div>
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
    .search-input::placeholder { color: #9ca3af; }
    .clear-btn { background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
    .clear-btn:hover { background: #f3f4f6; color: #374151; }
    .clear-btn .material-icons { font-size: 18px; }

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
      background: white; border-radius: 12px; padding: 16px 24px;
      border: 1px solid #e5e7eb; margin-bottom: 24px;
    }
    .stat-item { display: flex; align-items: baseline; gap: 6px; }
    .stat-num { font-size: 22px; font-weight: 800; color: #4f46e5; }
    .stat-lbl { font-size: 13px; color: #6b7280; }
    .divider-v { width: 1px; height: 24px; background: #e5e7eb; }

    .mentor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

    .loading-center { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px; color: #6b7280; }

    .error-banner { display: flex; align-items: center; gap: 10px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; }
    .error-banner .material-icons { font-size: 20px; }

    .empty-state {
      grid-column: 1/-1; display: flex; flex-direction: column;
      align-items: center; padding: 80px 20px; gap: 12px;
    }
    .empty-icon { width: 72px; height: 72px; border-radius: 20px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
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
export class MentorListPage implements OnInit {
  readonly mentorStore = inject(MentorStore);
  private readonly router = inject(Router);

  readonly searchCtrl = new FormControl('');
  readonly availFilter = signal('');
  readonly filters = [
    { label: 'All', value: '' },
    { label: '🟢 Available', value: 'AVAILABLE' },
    { label: '🟡 Busy', value: 'BUSY' },
  ];

  ngOnInit(): void {
    this.mentorStore.loadApproved(undefined);
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(val => {
      if (val && val.length >= 2) this.mentorStore.search(val);
      else this.mentorStore.loadApproved(undefined);
    });
  }

  filteredMentors() {
    const avail = this.availFilter();
    const list = this.searchCtrl.value?.length ? this.mentorStore.searchResults() : this.mentorStore.approved();
    return avail ? list.filter(m => m.availabilityStatus === avail) : list;
  }

  reset(): void { this.searchCtrl.setValue(''); this.availFilter.set(''); }
  goToDetail(id: number): void { this.router.navigate(['/mentors', id]); }
  goToBook(id: number): void { this.router.navigate(['/sessions/request'], { queryParams: { mentorId: id } }); }
}
