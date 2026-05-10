import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SessionStore } from '../../../../core/store/session.store';
import { MentorStore } from '../../../../core/store/mentor.store';
import { AuthStore } from '../../../../core/store/auth.store';
import { SkillStore } from '../../../../core/store/skill.store';
import { SessionCardComponent } from '../../components/session-card/session-card.component';
import { SessionDto } from '../../../../shared/models';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

type DashTab = 'pending' | 'upcoming' | 'all' | 'confirmed';

@Component({
  selector: 'app-mentor-sessions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SessionCardComponent, PaginationComponent],
  templateUrl: './mentor-sessions.page.html',
  styleUrl: './mentor-sessions.page.scss'
})
export class MentorSessionsPage implements OnInit {
  readonly sessionStore = inject(SessionStore);
  readonly mentorStore = inject(MentorStore);
  readonly authStore = inject(AuthStore);
  readonly skillStore = inject(SkillStore);
  readonly router = inject(Router);

  readonly activeTab = signal<DashTab>('pending');
  readonly localPage = signal(1);
  readonly pageSize = 8;

  readonly rejectingSession = signal<SessionDto | null>(null);
  rejectReason = '';

  // 1. First filter by tab
  readonly allFilteredByTab = computed(() => {
    const all = this.sessionStore.mentorSessions();
    const tab = this.activeTab();
    
    switch(tab) {
      case 'pending':   return all.filter(s => s.status === 'REQUESTED');
      case 'upcoming':  return all.filter(s => s.status === 'ACCEPTED' || s.status === 'CONFIRMED');
      case 'confirmed': return all.filter(s => s.status === 'COMPLETED');
      default:          return all;
    }
  });

  // 2. Then paginate the filtered result locally
  readonly pagedSessions = computed(() => {
    const filtered = this.allFilteredByTab();
    const start = (this.localPage() - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  });

  readonly pendingSessions = computed(() => 
    this.sessionStore.mentorSessions().filter(s => s.status === 'REQUESTED')
  );
  readonly upcomingSessions = computed(() => 
    this.sessionStore.mentorSessions().filter(s => s.status === 'ACCEPTED' || s.status === 'CONFIRMED')
  );
  readonly completedSessions = computed(() => 
    this.sessionStore.mentorSessions().filter(s => s.status === 'COMPLETED')
  );

  readonly tabs: { key: DashTab; label: string }[] = [
    { key: 'pending',   label: 'Incoming Requests' },
    { key: 'upcoming',  label: 'Accepted Schedule' },
    { key: 'confirmed', label: 'Completed Sessions' },
    { key: 'all',       label: 'Session History' },
  ];

  readonly quickReasons = [
    'Schedule Conflict',
    'Personal Emergency',
    'Topic Misaligned',
    'Full Capacity',
  ];

  onPageChange(page: number): void {
    this.localPage.set(page + 1); // PaginationComponent is 0-indexed, localPage is 1-indexed
  }

  ngOnInit(): void {
    this.sessionStore.loadMentorSessions({ page: 0, size: 100 });
    this.mentorStore.loadMyProfile(undefined);
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }
  }

  getSkillName(id: number): string {
    const s = this.skillStore.getSkillById(id);
    return s ? s.skillName : ('Skill #' + id);
  }

  refresh(): void {
    this.sessionStore.loadMentorSessions({ page: 0, size: 100 });
  }

  toggleAvailability(): void {
    if (!this.authStore.isMentor()) {
      this.authStore.refreshToken(undefined);
      return;
    }
    const next = this.mentorStore.isAvailable() ? 'BUSY' : 'AVAILABLE';
    this.mentorStore.updateAvailability({ availabilityStatus: next });
  }

  accept(id: number): void {
    this.sessionStore.accept(id);
  }

  openReject(s: SessionDto): void { this.rejectingSession.set(s); this.rejectReason = ''; }

  confirmReject(): void {
    const s = this.rejectingSession();
    if (!s || !this.rejectReason.trim()) return;
    this.sessionStore.reject({ id: s.id, reason: this.rejectReason });
    this.rejectingSession.set(null);
  }

  changeTab(tab: DashTab): void {
    this.activeTab.set(tab);
    this.localPage.set(1); // Reset to page 1 on tab change
  }

  cancelSession(id: number): void {
    this.sessionStore.cancel(id);
  }

  noop(): void {
    // Used for event swallowing if needed
  }
}
