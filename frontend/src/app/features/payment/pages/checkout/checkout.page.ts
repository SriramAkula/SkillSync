import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentStore } from '../../../../core/auth/payment.store';
import { AuthStore } from '../../../../core/auth/auth.store';

declare const Razorpay: any;

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="checkout-wrapper">
        @if (paymentStore.loading()) {
          <div class="loading-center"><mat-spinner diameter="48" /></div>
        }

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
            @if (saga.status === 'FAILED') {
              <div class="status-banner error">
                <span class="material-icons">error</span>
                {{ saga.failureReason ?? 'Payment failed. Please try again.' }}
              </div>
            }
            @if (saga.status === 'INITIATED') {
              <div class="status-banner info">
                <span class="material-icons">hourglass_top</span>
                Waiting for mentor to accept the session.
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
export class CheckoutPage implements OnInit {
  readonly paymentStore = inject(PaymentStore);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  ngOnInit(): void {
    const sessionId = Number(this.route.snapshot.queryParamMap.get('sessionId'));
    if (sessionId) this.paymentStore.loadSaga(sessionId);
  }

  openRazorpay(saga: any): void {
    const options = {
      key: 'rzp_test_SWGUsISMJTk4IH',
      amount: saga.amount * 100, currency: 'INR',
      name: 'SkillSync', description: `Session #${saga.sessionId}`,
      order_id: saga.paymentReference,
      handler: (response: any) => {
        this.paymentStore.verifyPayment({
          sessionId: saga.sessionId,
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

  statusIcon(s: string): string { return { COMPLETED: 'check_circle', FAILED: 'error', PAYMENT_PENDING: 'payment', INITIATED: 'hourglass_top' }[s] ?? 'payment'; }
  statusTitle(s: string): string { return { COMPLETED: 'Payment Complete', FAILED: 'Payment Failed', PAYMENT_PENDING: 'Complete Your Payment', INITIATED: 'Awaiting Mentor', REFUNDED: 'Refunded' }[s] ?? 'Payment'; }
}
