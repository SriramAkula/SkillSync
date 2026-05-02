import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SessionStore } from '../../../../core/store/session.store';
import { MentorStore } from '../../../../core/store/mentor.store';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthStore } from '../../../../core/store/auth.store';

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
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  templateUrl: './session-detail.page.html',
  styleUrl: './session-detail.page.scss'
})
export class SessionDetailPage implements OnInit {
  readonly sessionStore = inject(SessionStore);
  readonly mentorStore = inject(MentorStore);
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly showReject = signal(false);
  rejectReason = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.sessionStore.loadById(id);
    if (this.authStore.isMentor() && !this.mentorStore.myProfile()) {
      this.mentorStore.loadMyProfile();
    }
  }

  accept(id: number): void {
    this.sessionStore.accept(id);
    this.toast.success('Session accepted!');
  }

  reject(id: number): void {
    if (!this.rejectReason) return;
    this.sessionStore.reject({ id, reason: this.rejectReason });
    this.showReject.set(false);
    this.toast.success('Session rejected.');
  }

  cancel(id: number): void {
    this.sessionStore.cancel(id);
    this.toast.success('Session cancelled.');
  }

  get isLearnerForThisSession(): boolean {
    const s = this.sessionStore.selected();
    return s ? Number(this.authStore.userId()) === Number(s.learnerId) : false;
  }

  get isMentorForThisSession(): boolean {
    const s = this.sessionStore.selected();
    const myMentorProfile = this.mentorStore.myProfile();
    return (s && myMentorProfile) ? s.mentorId === myMentorProfile.id : false;
  }

  cfg(status: string) { return STATUS[status] ?? STATUS['CANCELLED']; }

  get scheduledAtUtc(): string {
    const s = this.sessionStore.selected();
    if (!s?.scheduledAt) return '';
    return s.scheduledAt.endsWith('Z') || s.scheduledAt.includes('+') 
      ? s.scheduledAt 
      : s.scheduledAt + 'Z';
  }
}
