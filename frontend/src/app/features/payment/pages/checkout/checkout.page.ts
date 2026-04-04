import 'tslib';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentStore } from '../../../../core/auth/payment.store';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SessionStore } from '../../../../core/auth/session.store';
import { effect } from '@angular/core';

declare const Razorpay: any;

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="checkout-wrapper">
        @if (paymentStore.loading() || (paymentStore.saga()?.status === 'INITIATED' && sessionStore.selected()?.status === 'ACCEPTED')) {
          <div class="loading-center">
            <mat-spinner diameter="48" />
            <p style="margin-top: 16px; color: #6b7280; font-weight: 500;">Preparing your checkout...</p>
          </div>
        } @else {
          @if (paymentStore.saga(); as saga) {
            <div class="checkout-card">
              <!-- Header -->
              <div class="checkout-header">
                <div class="payment-icon" [class]="'status-' + saga.status.toLowerCase()">
                  <span class="material-icons">{{ statusIcon(saga.status) }}</span>
                </div>
                <h2>{{ statusTitle(saga.status) }}</h2>
                <p>Session #{{ saga.sessionId }}</p>
              </div>

              <!-- Amount -->
              @if (saga.amount) {
                <div class="amount-section">
                  <div class="amount-row">
                    <span class="amount-label">Session Duration</span>
                    <span class="amount-value-sm">{{ saga.durationMinutes }} min</span>
                  </div>
                  <div class="amount-row">
                    <span class="amount-label">Hourly Rate</span>
                    <span class="amount-value-sm">₹{{ saga.hourlyRate }}/hr</span>
                  </div>
                  <div class="amount-divider"></div>
                  <div class="amount-row total">
                    <span>Total Amount</span>
                    <span class="amount-big">₹{{ saga.amount | number:'1.2-2' }}</span>
                  </div>
                </div>
              }

              <!-- Status Banners -->
              @if (saga.status === 'COMPLETED') {
                <div class="status-banner success">
                  <span class="material-icons">check_circle</span>
                  Payment successful! Your session is confirmed.
                </div>
              }
              @if (saga.status === 'FAILED' || saga.status === 'COMPENSATION_FAILED') {
                <div class="status-banner error">
                  <span class="material-icons">error</span>
                  {{ saga.failureReason ?? 'Payment failed. Please try again.' }}
                </div>
              }
              @if (saga.status === 'REJECTED') {
                <div class="status-banner error">
                  <span class="material-icons">cancel</span>
                  The mentor has declined this session request.
                </div>
              }

              <!-- Actions -->
              <div class="checkout-actions">
                @if (saga.status === 'PAYMENT_PENDING' && saga.paymentReference) {
                  <button class="btn-pay" (click)="openRazorpay(saga)" [disabled]="paymentStore.loading()">
                    <span class="material-icons">payment</span>
                    Pay ₹{{ saga.amount | number:'1.2-2' }} via Razorpay
                  </button>
                }
                @if (saga.status === 'FAILED') {
                  <button class="btn-retry" (click)="retryPayment()" [disabled]="paymentStore.loading()">
                    <span class="material-icons">refresh</span>
                    Retry Payment
                  </button>
                }
                @if (saga.status === 'COMPLETED') {
                  <button class="btn-secondary" (click)="router.navigate(['/sessions'])">
                    <span class="material-icons">event</span> View My Sessions
                  </button>
                }
                <button class="btn-ghost" (click)="router.navigate(['/sessions'])">
                  Back to Sessions
                </button>
              </div>
            </div>

            <!-- Security Note -->
            <div class="security-note">
              <span class="material-icons">lock</span>
              Secured by Razorpay · 256-bit SSL encryption
            </div>
          }
        }

        @if (paymentStore.error()) {
          <div class="error-banner">
            <span class="material-icons">error_outline</span>
            {{ paymentStore.error() }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: calc(100vh - 64px); display: flex; align-items: center; justify-content: center; padding: 24px; background: #f9fafb; }
    .checkout-wrapper { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 16px; }

    .checkout-card { background: white; border-radius: 24px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.08); }

    .checkout-header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; text-align: center; color: white; }
    .payment-icon { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 2px solid rgba(255,255,255,0.3); }
    .payment-icon .material-icons { font-size: 32px; color: white; }
    .payment-icon.status-completed { background: rgba(16,185,129,0.3); border-color: rgba(16,185,129,0.5); }
    .payment-icon.status-failed { background: rgba(239,68,68,0.3); border-color: rgba(239,68,68,0.5); }
    .checkout-header h2 { font-size: 22px; font-weight: 800; margin: 0 0 6px; }
    .checkout-header p { font-size: 14px; opacity: 0.8; margin: 0; }

    .amount-section { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
    .amount-row { display: flex; justify-content: space-between; align-items: center; }
    .amount-label { font-size: 14px; color: #6b7280; }
    .amount-value-sm { font-size: 14px; font-weight: 600; color: #374151; }
    .amount-divider { height: 1px; background: #e5e7eb; }
    .amount-row.total { padding-top: 4px; }
    .amount-row.total span:first-child { font-size: 15px; font-weight: 600; color: #111827; }
    .amount-big { font-size: 28px; font-weight: 800; color: #4f46e5; }

    .status-banner { display: flex; align-items: center; gap: 10px; margin: 0 24px 16px; padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 500; }
    .status-banner .material-icons { font-size: 20px; flex-shrink: 0; }
    .status-banner.success { background: #dcfce7; color: #16a34a; }
    .status-banner.error { background: #fee2e2; color: #dc2626; }
    .status-banner.info { background: #e0f2fe; color: #0369a1; }

    .checkout-actions { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 10px; }
    .btn-pay { height: 52px; border-radius: 14px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(79,70,229,0.35); transition: opacity 0.2s, transform 0.1s; }
    .btn-pay:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-pay:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-pay .material-icons { font-size: 22px; }
    .btn-retry { height: 52px; border-radius: 14px; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(220,38,38,0.25); transition: opacity 0.2s; }
    .btn-retry:hover:not(:disabled) { opacity: 0.9; }
    .btn-retry:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-retry .material-icons { font-size: 22px; }
    .btn-secondary { height: 48px; border-radius: 12px; background: #eef2ff; color: #4f46e5; border: none; font-size: 15px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s; }
    .btn-secondary:hover { background: #e0e7ff; }
    .btn-secondary .material-icons { font-size: 18px; }
    .btn-ghost { height: 44px; border-radius: 12px; background: none; color: #6b7280; border: 1.5px solid #e5e7eb; font-size: 14px; font-weight: 500; cursor: pointer; transition: border-color 0.15s, color 0.15s; }
    .btn-ghost:hover { border-color: #4f46e5; color: #4f46e5; }

    .security-note { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; color: #9ca3af; }
    .security-note .material-icons { font-size: 14px; }

    .loading-center { display: flex; justify-content: center; padding: 80px; }
    .error-banner { display: flex; align-items: center; gap: 10px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 14px 18px; border-radius: 12px; font-size: 14px; }
    .error-banner .material-icons { font-size: 20px; }
  `]
})
export class CheckoutPage implements OnInit, OnDestroy {
  readonly paymentStore = inject(PaymentStore) as any;
  private readonly authStore = inject(AuthStore) as any;
  readonly sessionStore = inject(SessionStore) as any;
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  private pollingInterval?: any;

  constructor() {
    // Proactive Saga Start logic
    effect(() => {
      const session = this.sessionStore.selected() as any;
      const saga = this.paymentStore.saga();
      const loading = this.paymentStore.loading();

      const isPayableSession = session && session.status === 'ACCEPTED';
      const needsSagaStart = !saga || saga.status === 'INITIATED';

      // Optimized check: Advance to startSaga if session is accepted but saga isn't pending yet.
      if (isPayableSession && needsSagaStart && !loading && !this.paymentStore.error()) {
        this.paymentStore.startSaga({
          sessionId: (session as any).id,
          mentorId: (session as any).mentorId,
          learnerId: (session as any).learnerId,
          durationMinutes: (session as any).durationMinutes
        });
      }
    }, { allowSignalWrites: true });

    // Guard Effect: Redirect if the session is not in a payable state
    effect(() => {
      const session = this.sessionStore.selected() as any;
      if (session && session.status !== 'ACCEPTED' && session.status !== 'CONFIRMED') {
        console.warn('[Checkout] Redirecting: session status is', session.status);
        this.router.navigate(['/sessions']);
      }
    }, { allowSignalWrites: true });

    // Status Polling Effect: Automatically keep the state in sync for transient statuses
    effect(() => {
      const saga = this.paymentStore.saga();
      // We still poll INITIATED just in case of a race condition during start, 
      // but primarily we poll for PAYMENT_PROCESSING verification.
      if (saga && (saga.status === 'INITIATED' || saga.status === 'PAYMENT_PROCESSING')) {
        this.startPolling(saga.sessionId);
      } else {
        this.stopPolling();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const sessionId = Number(this.route.snapshot.queryParamMap.get('sessionId'));
    if (sessionId) {
      this.paymentStore.reset();
      this.paymentStore.loadSaga(sessionId);
      this.sessionStore.loadById(sessionId);
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private startPolling(sessionId: number): void {
    if (this.pollingInterval) return;
    this.pollingInterval = setInterval(() => {
      // Don't poll if we are already loading a response
      if (!this.paymentStore.loading()) {
        this.paymentStore.loadSaga(sessionId);
      }
    }, 5000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }

  retryPayment(): void {
    const session = this.sessionStore.selected() as any;
    if (!session) return;
    // Reset store state so the effect can trigger a fresh startSaga
    this.paymentStore.reset();
    this.paymentStore.startSaga({
      sessionId: session.id,
      mentorId: session.mentorId,
      learnerId: session.learnerId,
      durationMinutes: session.durationMinutes
    });
  }

  openRazorpay(saga: any): void {
    const options = {
      key: 'rzp_test_SWGUsISMJTk4IH',
      amount: saga.amount * 100, currency: 'INR',
      name: 'SkillSync', description: `Session #${saga.sessionId}`,
      order_id: saga.paymentReference,
      handler: (response: any) => {
        this.paymentStore.verifyPayment({
          sessionId: (saga as any).sessionId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        });
      },
      prefill: { email: this.authStore.email() ?? '' },
      theme: { color: '#4f46e5' }
    };
    new Razorpay(options).open();
  }

  statusIcon(s: string): string { return { COMPLETED: 'check_circle', FAILED: 'error', COMPENSATION_FAILED: 'error', PAYMENT_PENDING: 'payment', INITIATED: 'sync', REJECTED: 'cancel', REFUNDED: 'replay' }[s] ?? 'payment'; }
  statusTitle(s: string): string { return { COMPLETED: 'Payment Complete', FAILED: 'Payment Failed', COMPENSATION_FAILED: 'Payment Failed', PAYMENT_PENDING: 'Complete Your Payment', INITIATED: 'Preparing Checkout...', REJECTED: 'Session Declined', REFUNDED: 'Refunded' }[s] ?? 'Payment'; }
}
