import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { SessionCardComponent } from '../../components/session-card/session-card.component';
import { SessionDto } from '../../../../shared/models';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

@Component({
  selector: 'app-my-sessions-page',
  standalone: true,
  imports: [CommonModule, SessionCardComponent],
  templateUrl: './my-sessions.page.html',
  styleUrl: './my-sessions.page.scss'
})
export class MySessionsPage implements OnInit {
  readonly sessionStore = inject(SessionStore) as any;
  readonly skillStore = inject(SkillStore) as any;
  readonly router = inject(Router);

  readonly activeTab = signal<FilterTab>('all');

  readonly tabs: { key: FilterTab; label: string }[] = [
    { key: 'all',       label: 'All Sessions' },
    { key: 'active',    label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  ngOnInit(): void { 
    this.sessionStore.loadLearnerSessions(undefined); 
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }
  }

  // Computed counts for better performance
  activeCount = computed(() => (this.sessionStore.learnerSessions() as SessionDto[]).filter(s => ['REQUESTED','ACCEPTED','CONFIRMED'].includes(s.status)).length);
  completedCount = computed(() => (this.sessionStore.learnerSessions() as SessionDto[]).filter(s => s.status === 'CONFIRMED').length);
  cancelledCount = computed(() => (this.sessionStore.learnerSessions() as SessionDto[]).filter(s => ['CANCELLED','REJECTED','PAYMENT_FAILED'].includes(s.status)).length);

  filteredSessions(): SessionDto[] {
    const all = this.sessionStore.learnerSessions() as SessionDto[];
    switch (this.activeTab()) {
      case 'active':    return all.filter(s => ['REQUESTED','ACCEPTED','CONFIRMED'].includes(s.status));
      case 'completed': return all.filter(s => s.status === 'CONFIRMED');
      case 'cancelled': return all.filter(s => ['CANCELLED','REJECTED','PAYMENT_FAILED'].includes(s.status));
      default:          return all;
    }
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
