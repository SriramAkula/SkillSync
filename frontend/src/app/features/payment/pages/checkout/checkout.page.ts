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
  templateUrl: './checkout.page.html',
  styleUrl: './checkout.page.scss'
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
