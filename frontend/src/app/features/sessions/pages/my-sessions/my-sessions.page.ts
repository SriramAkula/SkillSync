import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionStore } from '../../../../core/store/session.store';
import { SkillStore } from '../../../../core/store/skill.store';
import { SessionCardComponent } from '../../components/session-card/session-card.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

@Component({
  selector: 'app-my-sessions-page',
  standalone: true,
  imports: [CommonModule, SessionCardComponent, PaginationComponent],
  templateUrl: './my-sessions.page.html',
  styleUrl: './my-sessions.page.scss'
})
export class MySessionsPage implements OnInit {
  readonly sessionStore = inject(SessionStore);
  readonly skillStore = inject(SkillStore);
  readonly router = inject(Router);

  readonly activeTab = signal<FilterTab>('all');
  readonly localPage = signal(1);
  readonly pageSize = 9;

  // 1. Filter by tab
  readonly allFilteredByTab = computed(() => {
    const all = this.sessionStore.learnerSessions();
    const tab = this.activeTab();
    
    switch(tab) {
      case 'active':    return all.filter(s => ['REQUESTED', 'ACCEPTED', 'CONFIRMED'].includes(s.status));
      case 'completed': return all.filter(s => s.status === 'COMPLETED');
      case 'cancelled': return all.filter(s => ['CANCELLED', 'REJECTED', 'PAYMENT_FAILED', 'REFUNDED'].includes(s.status));
      default:          return all;
    }
  });

  // 2. Paginate locally
  readonly pagedSessions = computed(() => {
    const filtered = this.allFilteredByTab();
    const start = (this.localPage() - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  });

  // Counts for Stats Grid
  readonly activeCount = computed(() => 
    this.sessionStore.learnerSessions().filter(s => ['REQUESTED', 'ACCEPTED', 'CONFIRMED'].includes(s.status)).length
  );
  readonly completedCount = computed(() => 
    this.sessionStore.learnerSessions().filter(s => s.status === 'COMPLETED').length
  );
  readonly cancelledCount = computed(() => 
    this.sessionStore.learnerSessions().filter(s => ['CANCELLED', 'REJECTED', 'PAYMENT_FAILED', 'REFUNDED'].includes(s.status)).length
  );

  readonly tabs: { key: FilterTab; label: string }[] = [
    { key: 'all',       label: 'All Sessions' },
    { key: 'active',    label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  ngOnInit(): void {
    this.sessionStore.loadLearnerSessions({ page: 0, size: 100 });
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }
  }

  onPageChange(page: number): void {
    this.localPage.set(page + 1);
  }

  changeTab(tab: FilterTab): void {
    this.activeTab.set(tab);
    this.localPage.set(1);
  }

  loadMore(): void {
    const nextPage = this.sessionStore.learnerCurrentPage() + 1;
    // Note: For "Load More" style, the store needs to append. 
    // Our currently implemented store replaces. 
    // Let's stick to standard pagination for now for consistency, or update store to append.
    // For now, let's just use the standard pagination component in the HTML.
    this.sessionStore.loadLearnerSessions({ page: nextPage, size: 12 });
  }

  emptyIcon(): string {
    const icons: Record<FilterTab, string> = { all: 'event_note', active: 'auto_fix_off', completed: 'assignment_turned_in', cancelled: 'event_busy' };
    return icons[this.activeTab()];
  }

  emptyTitle(): string {
    const titles: Record<FilterTab, string> = { all: 'No sessions recorded', active: 'No ongoing sessions', completed: 'No completed goals', cancelled: 'No cancelled sessions' };
    return titles[this.activeTab()];
  }

  emptyDesc(): string {
    const descs: Record<FilterTab, string> = {
      all: 'Your journey starts here. Book a session with a top-tier mentor to accelerate your growth.',
      active: 'You are all caught up! Browse upcoming slots or reach out to mentors.',
      completed: 'Once you finish your first session, it will appear here for review.',
      cancelled: 'Good news! You have no cancelled or rejected sessions.'
    };
    return descs[this.activeTab()];
  }
}
