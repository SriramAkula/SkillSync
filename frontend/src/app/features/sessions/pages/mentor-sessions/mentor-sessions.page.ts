import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SessionStore } from '../../../../core/auth/session.store';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SessionCardComponent } from '../../components/session-card/session-card.component';
import { SessionDto } from '../../../../shared/models';

type DashTab = 'pending' | 'upcoming' | 'all';

@Component({
  selector: 'app-mentor-sessions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatSnackBarModule, SessionCardComponent],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="dash-header">
        <div class="header-left">
          <div class="header-icon">
            <span class="material-icons">dashboard</span>
          </div>
          <div>
            <h1>Mentor Dashboard</h1>
            <p>Manage your sessions and track your progress</p>
          </div>
        </div>
        <button class="btn-availability" (click)="toggleAvailability()">
          <span class="avail-dot" [class.available]="mentorStore.isAvailable()"></span>
          {{ mentorStore.isAvailable() ? 'Available' : 'Unavailable' }}
          <span class="material-icons">expand_more</span>
        </button>
      </div>

      @if (sessionStore.loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      } @else {

        <!-- ── Stats Row ── -->
        <div class="stats-row">
          <div class="stat-card" [class.highlight]="activeTab() === 'pending'" (click)="activeTab.set('pending')">
            <div class="stat-icon pending-icon">
              <span class="material-icons">pending_actions</span>
            </div>
            <div class="stat-body">
              <span class="stat-num">{{ pendingSessions().length }}</span>
              <span class="stat-lbl">Pending</span>
            </div>
            @if (pendingSessions().length > 0) {
              <span class="stat-badge">Action needed</span>
            }
          </div>

          <div class="stat-card" [class.highlight]="activeTab() === 'upcoming'" (click)="activeTab.set('upcoming')">
            <div class="stat-icon upcoming-icon">
              <span class="material-icons">event_available</span>
            </div>
            <div class="stat-body">
              <span class="stat-num">{{ upcomingSessions().length }}</span>
              <span class="stat-lbl">Upcoming</span>
            </div>
          </div>

          <div class="stat-card" [class.highlight]="activeTab() === 'all'" (click)="activeTab.set('all')">
            <div class="stat-icon total-icon">
              <span class="material-icons">event_note</span>
            </div>
            <div class="stat-body">
              <span class="stat-num">{{ sessionStore.mentorSessions().length }}</span>
              <span class="stat-lbl">Total</span>
            </div>
          </div>

          <div class="stat-card earnings-card">
            <div class="stat-icon earn-icon">
              <span class="material-icons">payments</span>
            </div>
            <div class="stat-body">
              <span class="stat-num">{{ confirmedSessions().length }}</span>
              <span class="stat-lbl">Confirmed</span>
            </div>
          </div>
        </div>

        <!-- ── Pending Requests ── -->
        @if (activeTab() === 'pending') {
          <div class="section">
            <div class="section-header">
              <h2>
                <span class="material-icons">pending_actions</span>
                Pending Requests
              </h2>
              @if (pendingSessions().length > 0) {
                <span class="section-badge">{{ pendingSessions().length }} awaiting response</span>
              }
            </div>

            @if (pendingSessions().length === 0) {
              <div class="empty-state">
                <div class="empty-icon"><span class="material-icons">inbox</span></div>
                <h3>All caught up!</h3>
                <p>No pending session requests right now.</p>
              </div>
            } @else {
              <div class="request-list">
                @for (s of pendingSessions(); track s.id) {
                  <div class="request-card">
                    <div class="request-left">
                      <div class="request-avatar">
                        <span class="material-icons">person</span>
                      </div>
                      <div class="request-info">
                        <div class="request-title">Session Request #{{ s.id }}</div>
                        <div class="request-meta">
                          <span class="meta-chip">
                            <span class="material-icons">calendar_today</span>
                            {{ s.scheduledAt | date:'EEE, MMM d' }}
                          </span>
                          <span class="meta-chip">
                            <span class="material-icons">schedule</span>
                            {{ s.scheduledAt | date:'h:mm a' }}
                          </span>
                          <span class="meta-chip">
                            <span class="material-icons">timer</span>
                            {{ s.durationMinutes }} min
                          </span>
                          <span class="meta-chip">
                            <span class="material-icons">auto_stories</span>
                            Skill #{{ s.skillId }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="request-actions">
                      <button class="btn-details-sm" (click)="router.navigate(['/sessions', s.id])">
                        <span class="material-icons">open_in_new</span>
                      </button>
                      <button class="btn-reject-sm" (click)="openReject(s)">
                        <span class="material-icons">close</span>
                        Decline
                      </button>
                      <button class="btn-accept-sm" (click)="accept(s.id)">
                        <span class="material-icons">check</span>
                        Accept
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- ── Upcoming Sessions ── -->
        @if (activeTab() === 'upcoming') {
          <div class="section">
            <div class="section-header">
              <h2>
                <span class="material-icons">event_available</span>
                Upcoming Sessions
              </h2>
            </div>
            @if (upcomingSessions().length === 0) {
              <div class="empty-state">
                <div class="empty-icon"><span class="material-icons">event_busy</span></div>
                <h3>No upcoming sessions</h3>
                <p>Accepted sessions scheduled in the future will appear here.</p>
              </div>
            } @else {
              <div class="sessions-grid">
                @for (s of upcomingSessions(); track s.id) {
                  <app-session-card [session]="s"
                    (view)="router.navigate(['/sessions', $event])"
                    (cancel)="cancelSession($event)"
                    (pay)="noop()" />
                }
              </div>
            }
          </div>
        }

        <!-- ── All Sessions ── -->
        @if (activeTab() === 'all') {
          <div class="section">
            <div class="section-header">
              <h2>
                <span class="material-icons">event_note</span>
                All Sessions
              </h2>
            </div>
            @if (sessionStore.mentorSessions().length === 0) {
              <div class="empty-state">
                <div class="empty-icon"><span class="material-icons">event_note</span></div>
                <h3>No sessions yet</h3>
                <p>Your session history will appear here.</p>
              </div>
            } @else {
              <div class="sessions-grid">
                @for (s of sessionStore.mentorSessions(); track s.id) {
                  <app-session-card [session]="s"
                    (view)="router.navigate(['/sessions', $event])"
                    (cancel)="cancelSession($event)"
                    (pay)="noop()" />
                }
              </div>
            }
          </div>
        }

      }

      <!-- ── Reject Modal ── -->
      @if (rejectingSession()) {
        <div class="modal-overlay" (click)="rejectingSession.set(null)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-icon">
                <span class="material-icons">cancel</span>
              </div>
              <div>
                <h3>Decline Session</h3>
                <p>Session #{{ rejectingSession()!.id }}</p>
              </div>
              <button class="modal-close" (click)="rejectingSession.set(null)">
                <span class="material-icons">close</span>
              </button>
            </div>
            <p class="modal-sub">Let the learner know why you're declining so they can find another mentor.</p>
            <div class="reason-chips">
              @for (r of quickReasons; track r) {
                <button class="reason-chip" [class.active]="rejectReason === r"
                        (click)="rejectReason = r">{{ r }}</button>
              }
            </div>
            <div class="input-wrapper">
              <span class="material-icons input-icon">edit_note</span>
              <input type="text" [(ngModel)]="rejectReason" placeholder="Or type a custom reason..." />
            </div>
            <div class="modal-actions">
              <button class="btn-modal-cancel" (click)="rejectingSession.set(null)">Cancel</button>
              <button class="btn-modal-reject" (click)="confirmReject()" [disabled]="!rejectReason.trim()">
                <span class="material-icons">cancel</span>
                Decline Session
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; }

    /* Header */
    .dash-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon {
      width: 52px; height: 52px; border-radius: 16px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .header-icon .material-icons { font-size: 26px; color: white; }
    .dash-header h1 { font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 3px; }
    .dash-header p { color: #6b7280; font-size: 14px; margin: 0; }

    .btn-availability {
      display: flex; align-items: center; gap: 8px;
      height: 40px; padding: 0 16px; border-radius: 20px;
      border: 1.5px solid #e5e7eb; background: white;
      font-size: 13px; font-weight: 600; color: #374151;
      cursor: pointer; transition: border-color 0.15s;
    }
    .btn-availability:hover { border-color: #4f46e5; }
    .btn-availability .material-icons { font-size: 18px; color: #9ca3af; }
    .avail-dot { width: 8px; height: 8px; border-radius: 50%; background: #9ca3af; }
    .avail-dot.available { background: #16a34a; }

    .loading-center { display: flex; justify-content: center; padding: 80px; }

    /* Stats Row */
    .stats-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
      margin-bottom: 28px;
    }
    @media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 400px) { .stats-row { grid-template-columns: 1fr 1fr; } }

    .stat-card {
      background: white; border-radius: 16px; border: 2px solid #e5e7eb;
      padding: 18px; cursor: pointer;
      display: flex; flex-direction: column; gap: 12px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .stat-card:hover { border-color: #c7d2fe; }
    .stat-card.highlight { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.08); }
    .earnings-card { cursor: default; }
    .earnings-card:hover { border-color: #e5e7eb; }

    .stat-icon {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon .material-icons { font-size: 20px; }
    .pending-icon  { background: #fef3c7; } .pending-icon  .material-icons { color: #d97706; }
    .upcoming-icon { background: #dbeafe; } .upcoming-icon .material-icons { color: #2563eb; }
    .total-icon    { background: #e0e7ff; } .total-icon    .material-icons { color: #4f46e5; }
    .earn-icon     { background: #dcfce7; } .earn-icon     .material-icons { color: #16a34a; }

    .stat-body { display: flex; flex-direction: column; gap: 2px; }
    .stat-num { font-size: 28px; font-weight: 800; color: #111827; line-height: 1; }
    .stat-lbl { font-size: 13px; color: #6b7280; font-weight: 500; }
    .stat-badge {
      font-size: 11px; font-weight: 600; color: #d97706;
      background: #fef3c7; padding: 2px 8px; border-radius: 20px;
      width: fit-content;
    }

    /* Section */
    .section { display: flex; flex-direction: column; gap: 16px; }
    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 8px;
    }
    .section-header h2 {
      display: flex; align-items: center; gap: 8px;
      font-size: 18px; font-weight: 700; color: #111827; margin: 0;
    }
    .section-header h2 .material-icons { font-size: 20px; color: #4f46e5; }
    .section-badge {
      background: #fef3c7; color: #d97706;
      padding: 4px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
    }

    /* Request List */
    .request-list { display: flex; flex-direction: column; gap: 10px; }
    .request-card {
      background: white; border-radius: 14px; border: 1px solid #e5e7eb;
      padding: 16px 20px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; flex-wrap: wrap;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .request-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); border-color: #c7d2fe; }

    .request-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
    .request-avatar {
      width: 44px; height: 44px; border-radius: 12px;
      background: #eef2ff; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .request-avatar .material-icons { font-size: 22px; color: #4f46e5; }
    .request-info { min-width: 0; }
    .request-title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 6px; }
    .request-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .meta-chip {
      display: flex; align-items: center; gap: 4px;
      background: #f3f4f6; color: #6b7280;
      padding: 3px 8px; border-radius: 6px;
      font-size: 12px; font-weight: 500;
    }
    .meta-chip .material-icons { font-size: 13px; }

    .request-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .btn-details-sm {
      width: 36px; height: 36px; border-radius: 8px;
      background: #f3f4f6; color: #6b7280; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .btn-details-sm:hover { background: #e5e7eb; color: #374151; }
    .btn-details-sm .material-icons { font-size: 16px; }

    .btn-reject-sm {
      display: flex; align-items: center; gap: 5px;
      height: 36px; padding: 0 14px; border-radius: 8px;
      background: #fee2e2; color: #dc2626; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s;
    }
    .btn-reject-sm:hover { background: #fecaca; }
    .btn-reject-sm .material-icons { font-size: 15px; }

    .btn-accept-sm {
      display: flex; align-items: center; gap: 5px;
      height: 36px; padding: 0 16px; border-radius: 8px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer;
      box-shadow: 0 2px 8px rgba(79,70,229,0.25); transition: opacity 0.15s;
    }
    .btn-accept-sm:hover { opacity: 0.9; }
    .btn-accept-sm .material-icons { font-size: 15px; }

    /* Sessions Grid */
    .sessions-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;
    }
    @media (max-width: 480px) { .sessions-grid { grid-template-columns: 1fr; } }

    /* Empty State */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 10px; padding: 60px 20px; text-align: center;
      background: white; border-radius: 16px; border: 1px solid #e5e7eb;
    }
    .empty-icon { width: 64px; height: 64px; border-radius: 18px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
    .empty-icon .material-icons { font-size: 32px; color: #9ca3af; }
    .empty-state h3 { font-size: 16px; font-weight: 700; color: #111827; margin: 0; }
    .empty-state p { font-size: 13px; color: #6b7280; margin: 0; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .modal-card { background: white; border-radius: 20px; padding: 28px; width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .modal-icon { width: 44px; height: 44px; border-radius: 12px; background: #fee2e2; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .modal-icon .material-icons { font-size: 22px; color: #dc2626; }
    .modal-header h3 { font-size: 17px; font-weight: 800; color: #111827; margin: 0 0 2px; }
    .modal-header p { font-size: 12px; color: #9ca3af; margin: 0; }
    .modal-close { margin-left: auto; background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
    .modal-close:hover { background: #f3f4f6; }
    .modal-close .material-icons { font-size: 20px; }
    .modal-sub { font-size: 14px; color: #6b7280; margin: 0 0 16px; line-height: 1.5; }

    .reason-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
    .reason-chip {
      padding: 6px 12px; border-radius: 20px; border: 1.5px solid #e5e7eb;
      background: white; color: #6b7280; font-size: 12px; font-weight: 500;
      cursor: pointer; transition: all 0.15s;
    }
    .reason-chip:hover { border-color: #dc2626; color: #dc2626; }
    .reason-chip.active { background: #fee2e2; border-color: #dc2626; color: #dc2626; font-weight: 600; }

    .input-wrapper { display: flex; align-items: center; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 0 14px; height: 52px; margin-bottom: 20px; }
    .input-wrapper:focus-within { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); background: white; }
    .input-icon { font-size: 18px; color: #9ca3af; margin-right: 10px; }
    .input-wrapper input { flex: 1; border: none; outline: none; font-size: 14px; color: #111827; background: transparent; }
    .input-wrapper input::placeholder { color: #9ca3af; }

    .modal-actions { display: flex; gap: 10px; }
    .btn-modal-cancel { flex: 1; height: 48px; border-radius: 12px; background: #f3f4f6; color: #374151; border: none; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-modal-reject { flex: 1; height: 48px; border-radius: 12px; background: #dc2626; color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: opacity 0.15s; }
    .btn-modal-reject:hover:not(:disabled) { opacity: 0.9; }
    .btn-modal-reject:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-modal-reject .material-icons { font-size: 18px; }
  `]
})
export class MentorSessionsPage implements OnInit {
  readonly sessionStore = inject(SessionStore);
  readonly mentorStore = inject(MentorStore);
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly activeTab = signal<DashTab>('pending');
  readonly rejectingSession = signal<SessionDto | null>(null);
  rejectReason = '';

  readonly quickReasons = [
    'Schedule conflict',
    'Not available that day',
    'Outside my expertise',
    'Already fully booked',
  ];

  readonly pendingSessions = computed(() =>
    this.sessionStore.mentorSessions().filter(s => s.status === 'REQUESTED')
  );
  readonly upcomingSessions = computed(() =>
    this.sessionStore.mentorSessions().filter(s =>
      ['ACCEPTED', 'CONFIRMED'].includes(s.status) &&
      new Date(s.scheduledAt) > new Date()
    )
  );
  readonly confirmedSessions = computed(() =>
    this.sessionStore.mentorSessions().filter(s => s.status === 'CONFIRMED')
  );

  ngOnInit(): void {
    this.sessionStore.loadMentorSessions(undefined);
    this.mentorStore.loadMyProfile(undefined);

    // Proactive token refresh: if the server confirms this user is a mentor
    // but their JWT still lacks ROLE_MENTOR (stale token after approval),
    // silently fetch a fresh token so the availability toggle works immediately.
    effect(() => {
      const profile = this.mentorStore.myProfile();
      if (profile && !this.authStore.isMentor()) {
        this.authStore.refreshToken(undefined);
      }
    }, { allowSignalWrites: false });
  }

  toggleAvailability(): void {
    // Guard: if the token is stale and doesn't yet reflect ROLE_MENTOR,
    // refresh it first and prompt the user to retry.
    if (!this.authStore.isMentor()) {
      this.authStore.refreshToken(undefined);
      this.snack.open(
        'Syncing your mentor permissions... Please try again in a moment.',
        'OK',
        { duration: 4000 }
      );
      return;
    }

    const next = this.mentorStore.isAvailable() ? 'BUSY' : 'AVAILABLE';
    this.mentorStore.updateAvailability({ availabilityStatus: next as any });
    this.snack.open(`Status set to ${next}`, 'OK', { duration: 2000 });
  }

  accept(id: number): void {
    this.sessionStore.accept(id);
    this.snack.open('Session accepted! The learner will be notified.', 'OK', { duration: 3000 });
  }

  openReject(s: SessionDto): void { this.rejectingSession.set(s); this.rejectReason = ''; }

  confirmReject(): void {
    const s = this.rejectingSession();
    if (!s || !this.rejectReason.trim()) return;
    this.sessionStore.reject({ id: s.id, reason: this.rejectReason });
    this.rejectingSession.set(null);
    this.snack.open('Session declined.', 'OK', { duration: 3000 });
  }

  cancelSession(id: number): void {
    this.sessionStore.cancel(id);
    this.snack.open('Session cancelled.', 'OK', { duration: 3000 });
  }

  noop(): void {}
}
