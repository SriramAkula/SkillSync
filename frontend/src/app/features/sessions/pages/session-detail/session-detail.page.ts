import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SessionStore } from '../../../../core/auth/session.store';
import { AuthStore } from '../../../../core/auth/auth.store';

const STATUS: Record<string, { color: string; bg: string; icon: string }> = {
  REQUESTED:      { color: '#d97706', bg: '#fef3c7', icon: 'schedule' },
  ACCEPTED:       { color: '#2563eb', bg: '#dbeafe', icon: 'thumb_up' },
  CONFIRMED:      { color: '#16a34a', bg: '#dcfce7', icon: 'check_circle' },
  REJECTED:       { color: '#dc2626', bg: '#fee2e2', icon: 'cancel' },
  CANCELLED:      { color: '#6b7280', bg: '#f3f4f6', icon: 'block' },
  PAYMENT_FAILED: { color: '#dc2626', bg: '#fee2e2', icon: 'payment' },
  REFUNDED:       { color: '#7c3aed', bg: '#ede9fe', icon: 'replay' },
};

@Component({
  selector: 'app-session-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">
      <button class="back-btn" (click)="router.navigate(['/sessions'])">
        <span class="material-icons">arrow_back</span> My Sessions
      </button>

      @if (sessionStore.loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      }

      @if (sessionStore.selected(); as s) {
        <div class="layout">
          <!-- Main Card -->
          <div class="main-col">
            <div class="detail-card">
              <div class="detail-header" [style.background]="cfg(s.status).bg">
                <div class="status-icon" [style.background]="cfg(s.status).color + '20'">
                  <span class="material-icons" [style.color]="cfg(s.status).color">{{ cfg(s.status).icon }}</span>
                </div>
                <div>
                  <h2>Session #{{ s.id }}</h2>
                  <div class="status-badge" [style.background]="cfg(s.status).color" style="color:white">
                    {{ s.status }}
                  </div>
                </div>
              </div>

              <div class="detail-body">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Scheduled</span>
                    <span class="info-value">{{ s.scheduledAt | date:'EEEE, MMM d, y' }}</span>
                    <span class="info-sub">{{ s.scheduledAt | date:'h:mm a' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Duration</span>
                    <span class="info-value">{{ s.durationMinutes }} minutes</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Mentor ID</span>
                    <span class="info-value">#{{ s.mentorId }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Skill ID</span>
                    <span class="info-value">#{{ s.skillId }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Created</span>
                    <span class="info-value">{{ s.createdAt | date:'mediumDate' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Last Updated</span>
                    <span class="info-value">{{ s.updatedAt | date:'mediumDate' }}</span>
                  </div>
                </div>

                @if (s.rejectionReason) {
                  <div class="rejection-box">
                    <span class="material-icons">info</span>
                    <div>
                      <strong>Rejection Reason</strong>
                      <p>{{ s.rejectionReason }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Actions Sidebar -->
          <div class="actions-col">
            <div class="actions-card">
              <h3>Actions</h3>

              @if (s.status === 'ACCEPTED' && isLearnerForThisSession) {
                <button class="action-btn primary" (click)="router.navigate(['/payment'], { queryParams: { sessionId: s.id } })">
                  <span class="material-icons">payment</span>
                  Pay Now
                </button>
              }

              @if (authStore.isMentor()) {
                @if (s.status === 'REQUESTED') {
                  <button class="action-btn success" (click)="accept(s.id)">
                    <span class="material-icons">check_circle</span>
                    Accept Session
                  </button>
                  <button class="action-btn danger" (click)="showReject.set(true)">
                    <span class="material-icons">cancel</span>
                    Reject Session
                  </button>
                }
              }

              @if (s.status === 'REQUESTED' || s.status === 'ACCEPTED') {
                <button class="action-btn secondary" (click)="cancel(s.id)">
                  <span class="material-icons">block</span>
                  Cancel Session
                </button>
              }

              @if (s.status === 'CONFIRMED') {
                <button class="action-btn outline" (click)="router.navigate(['/reviews/mentor', s.mentorId])">
                  <span class="material-icons">rate_review</span>
                  Write a Review
                </button>
              }

              <button class="action-btn outline" (click)="router.navigate(['/mentors', s.mentorId])">
                <span class="material-icons">person</span>
                View Mentor Profile
              </button>
            </div>

            <!-- Reject Form -->
            @if (showReject()) {
              <div class="reject-card">
                <h4>Reject Session</h4>
                <div class="input-wrapper">
                  <input type="text" [(ngModel)]="rejectReason" placeholder="Reason for rejection..." />
                </div>
                <div class="reject-actions">
                  <button class="action-btn secondary" (click)="showReject.set(false)">Cancel</button>
                  <button class="action-btn danger" (click)="reject(s.id)" [disabled]="!rejectReason">Confirm</button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; }
    .back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #6b7280; font-size: 14px; font-weight: 500; cursor: pointer; padding: 8px 0; margin-bottom: 24px; transition: color 0.15s; }
    .back-btn:hover { color: #4f46e5; }
    .back-btn .material-icons { font-size: 18px; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }

    .layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; }
    @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } }

    .detail-card { background: white; border-radius: 20px; border: 1px solid #e5e7eb; overflow: hidden; }
    .detail-header { display: flex; align-items: center; gap: 16px; padding: 24px; }
    .status-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .status-icon .material-icons { font-size: 26px; }
    .detail-header h2 { font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 6px; }
    .status-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }

    .detail-body { padding: 24px; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
    @media (max-width: 600px) { .info-grid { grid-template-columns: repeat(2, 1fr); } }
    .info-item { display: flex; flex-direction: column; gap: 3px; }
    .info-label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 15px; font-weight: 600; color: #111827; }
    .info-sub { font-size: 12px; color: #6b7280; }

    .rejection-box { display: flex; gap: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; }
    .rejection-box .material-icons { font-size: 20px; color: #dc2626; flex-shrink: 0; margin-top: 2px; }
    .rejection-box strong { display: block; font-size: 14px; color: #dc2626; margin-bottom: 4px; }
    .rejection-box p { font-size: 13px; color: #7f1d1d; margin: 0; }

    .actions-card { background: white; border-radius: 20px; border: 1px solid #e5e7eb; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .actions-card h3 { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 4px; }

    .action-btn { width: 100%; height: 44px; border-radius: 12px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.15s, background 0.15s; }
    .action-btn .material-icons { font-size: 18px; }
    .action-btn.primary { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; box-shadow: 0 4px 12px rgba(79,70,229,0.3); }
    .action-btn.success { background: #dcfce7; color: #16a34a; }
    .action-btn.success:hover { background: #bbf7d0; }
    .action-btn.danger { background: #fee2e2; color: #dc2626; }
    .action-btn.danger:hover { background: #fecaca; }
    .action-btn.secondary { background: #f3f4f6; color: #374151; }
    .action-btn.secondary:hover { background: #e5e7eb; }
    .action-btn.outline { background: white; color: #4f46e5; border: 1.5px solid #c7d2fe; }
    .action-btn.outline:hover { background: #eef2ff; }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .reject-card { background: white; border-radius: 16px; border: 1px solid #fecaca; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .reject-card h4 { font-size: 14px; font-weight: 700; color: #dc2626; margin: 0; }
    .input-wrapper { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 0 12px; height: 44px; display: flex; align-items: center; }
    .input-wrapper input { flex: 1; border: none; outline: none; font-size: 14px; color: #111827; background: transparent; }
    .reject-actions { display: flex; gap: 8px; }
    .reject-actions .action-btn { flex: 1; }
  `]
})
export class SessionDetailPage implements OnInit {
  readonly sessionStore = inject(SessionStore);
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snack = inject(MatSnackBar);

  readonly showReject = signal(false);
  rejectReason = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.sessionStore.loadById(id);
  }

  accept(id: number): void {
    this.sessionStore.accept(id);
    this.snack.open('Session accepted!', 'OK', { duration: 3000 });
  }

  reject(id: number): void {
    if (!this.rejectReason) return;
    this.sessionStore.reject({ id, reason: this.rejectReason });
    this.showReject.set(false);
    this.snack.open('Session rejected.', 'OK', { duration: 3000 });
  }

  cancel(id: number): void {
    this.sessionStore.cancel(id);
    this.snack.open('Session cancelled.', 'OK', { duration: 3000 });
  }

  get isLearnerForThisSession(): boolean {
    const s = this.sessionStore.selected() as any;
    return s ? Number(this.authStore.userId()) === Number(s.learnerId) : false;
  }

  cfg(status: string) { return STATUS[status] ?? STATUS['CANCELLED']; }
}
