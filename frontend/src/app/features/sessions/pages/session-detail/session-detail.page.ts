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
  templateUrl: './session-detail.page.html',
  styleUrl: './session-detail.page.scss'
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
