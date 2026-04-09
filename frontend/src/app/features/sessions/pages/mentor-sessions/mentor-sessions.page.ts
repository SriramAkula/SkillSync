import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { SessionCardComponent } from '../../components/session-card/session-card.component';
import { SessionDto } from '../../../../shared/models';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

type DashTab = 'pending' | 'upcoming' | 'all' | 'confirmed';

@Component({
  selector: 'app-mentor-sessions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SessionCardComponent, MatSnackBarModule, PaginationComponent],
  templateUrl: './mentor-sessions.page.html',
  styleUrl: './mentor-sessions.page.scss'
})
export class MentorSessionsPage implements OnInit {
  readonly sessionStore = inject(SessionStore) as any;
  readonly mentorStore = inject(MentorStore) as any;
  readonly authStore = inject(AuthStore) as any;
  readonly skillStore = inject(SkillStore) as any;
  readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  constructor() {
    effect(() => {
      const profile = this.mentorStore.myProfile();
      if (profile && !this.authStore.isMentor()) {
        this.authStore.refreshToken(undefined);
      }
    }, { allowSignalWrites: false });
  }

  readonly activeTab = signal<DashTab>('pending');
  readonly currentPage = signal(0);
  readonly pageSize = signal(8); // High-density cards
  readonly rejectingSession = signal<SessionDto | null>(null);
  rejectReason = '';

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

  readonly pendingSessions = computed(() =>
    (this.sessionStore.mentorSessions() as SessionDto[]).filter(s => s.status === 'REQUESTED')
  );
  readonly upcomingSessions = computed(() =>
    (this.sessionStore.mentorSessions() as SessionDto[]).filter(s =>
      ['ACCEPTED', 'CONFIRMED'].includes(s.status) &&
      new Date(s.scheduledAt) > new Date()
    )
  );
  readonly confirmedSessions = computed(() =>
    (this.sessionStore.mentorSessions() as SessionDto[]).filter(s => s.status === 'CONFIRMED')
  );

  readonly currentSessions = computed(() => {
    const tab = this.activeTab();
    if (tab === 'pending') return this.pendingSessions();
    if (tab === 'upcoming') return this.upcomingSessions();
    if (tab === 'confirmed') return this.confirmedSessions();
    return this.sessionStore.mentorSessions() as SessionDto[];
  });

  readonly pagedSessions = computed(() => {
    const list = this.currentSessions();
    const start = this.currentPage() * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.refresh();
    this.mentorStore.loadMyProfile(undefined);
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }
  }

  getSkillName(id: number): string {
    const s = this.skillStore.getSkillById(id);
    return s ? (s.skillName || s.name) : ('Skill #' + id);
  }

  refresh(): void {
    this.sessionStore.loadMentorSessions(undefined);
  }

  toggleAvailability(): void {
    if (!this.authStore.isMentor()) {
      this.authStore.refreshToken(undefined);
      return;
    }
    const next = this.mentorStore.isAvailable() ? 'BUSY' : 'AVAILABLE';
    this.mentorStore.updateAvailability({ availabilityStatus: next as any });
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
    this.currentPage.set(0); // Reset page on tab switch
  }

  cancelSession(id: number): void {
    this.sessionStore.cancel(id);
  }

  noop(): void {}
}
