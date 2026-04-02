import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SessionStore } from '../../../../core/auth/session.store';
import { SessionCardComponent } from '../../components/session-card/session-card.component';
import { SessionDto } from '../../../../shared/models';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

@Component({
  selector: 'app-my-sessions-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, SessionCardComponent],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>My Sessions</h1>
          <p>Track and manage your learning sessions</p>
        </div>
        <button class="btn-book" (click)="router.navigate(['/mentors'])">
          <span class="material-icons">add</span>
          Book Session
        </button>
      </div>

      @if (sessionStore.loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      } @else {

        <!-- Summary Cards -->
        <div class="summary-row">
          <div class="summary-card" [class.active-card]="activeTab() === 'all'" (click)="activeTab.set('all')">
            <span class="summary-num">{{ sessionStore.learnerSessions().length }}</span>
            <span class="summary-lbl">Total</span>
          </div>
          <div class="summary-card" [class.active-card]="activeTab() === 'active'" (click)="activeTab.set('active')">
            <span class="summary-num blue">{{ activeSessions().length }}</span>
            <span class="summary-lbl">Active</span>
          </div>
          <div class="summary-card" [class.active-card]="activeTab() === 'completed'" (click)="activeTab.set('completed')">
            <span class="summary-num green">{{ completedSessions().length }}</span>
            <span class="summary-lbl">Completed</span>
          </div>
          <div class="summary-card" [class.active-card]="activeTab() === 'cancelled'" (click)="activeTab.set('cancelled')">
            <span class="summary-num red">{{ cancelledSessions().length }}</span>
            <span class="summary-lbl">Cancelled</span>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs">
          @for (tab of tabs; track tab.key) {
            <button class="filter-tab" [class.active]="activeTab() === tab.key"
                    (click)="activeTab.set(tab.key)">
              {{ tab.label }}
              @if (countFor(tab.key) > 0) {
                <span class="tab-count" [class.active]="activeTab() === tab.key">
                  {{ countFor(tab.key) }}
                </span>
              }
            </button>
          }
        </div>

        <!-- Sessions Grid -->
        <div class="sessions-grid">
          @for (s of filteredSessions(); track s.id) {
            <app-session-card [session]="s"
              (view)="router.navigate(['/sessions', $event])"
              (cancel)="sessionStore.cancel($event)"
              (pay)="router.navigate(['/payment'], { queryParams: { sessionId: $event } })" />
          }
          @empty {
            <div class="empty-state">
              <div class="empty-icon">
                <span class="material-icons">{{ emptyIcon() }}</span>
              </div>
              <h3>{{ emptyTitle() }}</h3>
              <p>{{ emptyDesc() }}</p>
              @if (activeTab() === 'all') {
                <button class="btn-book-empty" (click)="router.navigate(['/mentors'])">
                  <span class="material-icons">search</span>
                  Find a Mentor
                </button>
              }
            </div>
          }
        </div>

      }
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; }

    /* Header */
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    }
    .page-header h1 { font-size: 28px; font-weight: 800; color: var(--text); margin: 0 0 4px; }
    .page-header p { color: var(--text-secondary); font-size: 14px; margin: 0; }
    .btn-book {
      display: flex; align-items: center; gap: 6px;
      height: 44px; padding: 0 20px; border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; border: none; font-size: 14px; font-weight: 600;
      cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,0.3); transition: opacity 0.2s;
    }
    .btn-book:hover { opacity: 0.9; }
    .btn-book .material-icons { font-size: 18px; }

    .loading-center { display: flex; justify-content: center; padding: 80px; }

    /* Summary Cards */
    .summary-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
      margin-bottom: 20px;
    }
    @media (max-width: 600px) { .summary-row { grid-template-columns: repeat(2, 1fr); } }

    .summary-card {
      background: var(--surface); border-radius: 14px; border: 2px solid var(--border);
      padding: 16px; text-align: center; cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .summary-card:hover { border-color: var(--primary); }
    .summary-card.active-card { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-muted); }
    .summary-num {
      display: block; font-size: 28px; font-weight: 800; color: var(--text); line-height: 1;
    }
    .summary-num.blue { color: #2563eb; }
    .summary-num.green { color: #16a34a; }
    .summary-num.red { color: #dc2626; }
    .summary-lbl { display: block; font-size: 12px; color: var(--text-secondary); margin-top: 4px; font-weight: 500; }

    /* Filter Tabs */
    .filter-tabs {
      display: flex; gap: 4px; background: var(--surface-alt);
      border-radius: 12px; padding: 4px; margin-bottom: 20px;
      overflow-x: auto; flex-wrap: nowrap;
    }
    .filter-tab {
      display: flex; align-items: center; gap: 6px;
      height: 36px; padding: 0 14px; border-radius: 9px;
      border: none; background: none; color: var(--text-secondary);
      font-size: 13px; font-weight: 600; cursor: pointer;
      white-space: nowrap; transition: background 0.15s, color 0.15s;
    }
    .filter-tab:hover { color: var(--text); }
    .filter-tab.active { background: var(--surface); color: var(--primary); box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .tab-count {
      background: var(--border); color: var(--text-secondary);
      font-size: 11px; font-weight: 700;
      min-width: 18px; height: 18px; border-radius: 9px; padding: 0 4px;
      display: flex; align-items: center; justify-content: center;
    }
    .tab-count.active { background: var(--primary-light); color: var(--primary); }

    /* Grid */
    .sessions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    @media (max-width: 480px) { .sessions-grid { grid-template-columns: 1fr; } }

    /* Empty State */
    .empty-state {
      grid-column: 1/-1; display: flex; flex-direction: column;
      align-items: center; gap: 12px; padding: 72px 20px; text-align: center;
    }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 20px;
      background: var(--surface-alt); display: flex; align-items: center; justify-content: center;
    }
    .empty-icon .material-icons { font-size: 36px; color: var(--text-muted); }
    .empty-state h3 { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
    .empty-state p { font-size: 14px; color: var(--text-secondary); margin: 0; max-width: 300px; }
    .btn-book-empty {
      display: flex; align-items: center; gap: 6px;
      height: 44px; padding: 0 20px; border-radius: 12px;
      background: #4f46e5; color: white; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 4px;
    }
    .btn-book-empty .material-icons { font-size: 18px; }
  `]
})
export class MySessionsPage implements OnInit {
  readonly sessionStore = inject(SessionStore);
  readonly router = inject(Router);

  readonly activeTab = signal<FilterTab>('all');

  readonly tabs = [
    { key: 'all' as FilterTab,       label: 'All Sessions' },
    { key: 'active' as FilterTab,    label: 'Active' },
    { key: 'completed' as FilterTab, label: 'Completed' },
    { key: 'cancelled' as FilterTab, label: 'Cancelled' },
  ];

  ngOnInit(): void { this.sessionStore.loadLearnerSessions(undefined); }

  activeSessions()   { return this.sessionStore.learnerSessions().filter(s => ['REQUESTED','ACCEPTED','CONFIRMED'].includes(s.status)); }
  completedSessions(){ return this.sessionStore.learnerSessions().filter(s => s.status === 'CONFIRMED'); }
  cancelledSessions(){ return this.sessionStore.learnerSessions().filter(s => ['CANCELLED','REJECTED','PAYMENT_FAILED'].includes(s.status)); }

  filteredSessions(): SessionDto[] {
    const all = this.sessionStore.learnerSessions();
    switch (this.activeTab()) {
      case 'active':    return this.activeSessions();
      case 'completed': return this.completedSessions();
      case 'cancelled': return this.cancelledSessions();
      default:          return all;
    }
  }

  countFor(tab: FilterTab): number {
    switch (tab) {
      case 'active':    return this.activeSessions().length;
      case 'completed': return this.completedSessions().length;
      case 'cancelled': return this.cancelledSessions().length;
      default:          return this.sessionStore.learnerSessions().length;
    }
  }

  emptyIcon(): string {
    const icons: Record<FilterTab, string> = { all: 'event_note', active: 'event_busy', completed: 'task_alt', cancelled: 'cancel' };
    return icons[this.activeTab()];
  }

  emptyTitle(): string {
    const titles: Record<FilterTab, string> = { all: 'No sessions yet', active: 'No active sessions', completed: 'No completed sessions', cancelled: 'No cancelled sessions' };
    return titles[this.activeTab()];
  }

  emptyDesc(): string {
    const descs: Record<FilterTab, string> = {
      all: 'Book your first session with a mentor to get started.',
      active: 'You have no ongoing sessions right now.',
      completed: 'Completed sessions will appear here.',
      cancelled: 'Cancelled or rejected sessions will appear here.'
    };
    return descs[this.activeTab()];
  }
}
