import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService, SessionProfile } from '../../core/services/session.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../shared/services/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  sessionService = inject(SessionService);
  paymentService = inject(PaymentService);
  authService = inject(AuthService);
  userService = inject(UserService);
  toast = inject(ToastService);

  isLearner = false;
  isMentor = false;

  sessions: (SessionProfile & { otherUserName?: string })[] = [];
  loading = true;
  actionLoading = false;

  ngOnInit() {
    this.isLearner = this.authService.hasRole('ROLE_LEARNER');
    this.isMentor = this.authService.hasRole('ROLE_MENTOR');
    this.loadSessions();
  }

  async loadSessions() {
    this.loading = true;
    try {
      if (this.isMentor) {
        this.sessions = await firstValueFrom(this.sessionService.getMentorSessions());
      } else if (this.isLearner) {
        this.sessions = await firstValueFrom(this.sessionService.getLearnerSessions());
      }
      
      // Hydrate usernames for sessions
      for (const s of this.sessions) {
        const idToFetch = this.isMentor ? s.learnerId : s.mentorId;
        if (idToFetch) {
          try {
            const user = await firstValueFrom(this.userService.getProfile(idToFetch));
            s.otherUserName = user.username;
          } catch(e) {
            s.otherUserName = 'Unknown';
          }
        }
      }
    } catch (e) {
      this.toast.error('Failed to load sessions');
    } finally {
      this.loading = false;
    }
  }

  acceptSession(sessionId: number) {
    if (this.actionLoading) return;
    this.actionLoading = true;
    this.sessionService.acceptSession(sessionId).subscribe({
      next: () => {
        this.toast.success('Session accepted. Razorpay order will be created.');
        this.loadSessions();
        this.actionLoading = false;
      },
      error: () => {
        this.toast.error('Failed to accept session');
        this.actionLoading = false;
      }
    });
  }

  payNow(sessionId: number) {
    if (this.actionLoading) return;
    this.actionLoading = true;
    // Step 1: Ensure Razorpay order is prepared by Saga / payment process fallback
    this.paymentService.processPayment(sessionId).subscribe({
      next: (sagaRes) => {
        if (!sagaRes.orderId) {
          this.toast.error('Payment order not ready yet. Please try again.');
          this.actionLoading = false;
          return;
        }

        // Initialize Razorpay
        const options = {
          key: 'rzp_test_mock', // Mock key for frontend structure
          amount: sagaRes.amount * 100, // paise
          currency: 'INR',
          name: 'SkillSync',
          description: `Session Payment ${sessionId}`,
          order_id: sagaRes.orderId,
          handler: (response: any) => {
             // Step 2: Verify Payment
             this.paymentService.verifyPayment({
               razorpayOrderId: response.razorpay_order_id,
               razorpayPaymentId: response.razorpay_payment_id,
               razorpaySignature: response.razorpay_signature || 'mock_sig',
               sessionId: sessionId
             }).subscribe({
               next: () => {
                 this.toast.success('Payment successful! Session is confirmed.');
                 this.loadSessions();
               },
               error: () => this.toast.error('Payment verification failed.')
             });
          },
          prefill: {
            name: this.authService.getTempEmail(),
            email: this.authService.getTempEmail()
          },
          theme: { color: '#4f46e5' }
        };
        
        try {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } catch(e) {
          this.toast.info('Razorpay not loaded. Simulating success for verification.');
          // Mocking success flow since we might not have the Razorpay script loaded
           this.paymentService.verifyPayment({
             razorpayOrderId: sagaRes.orderId,
             razorpayPaymentId: 'pay_mock123',
             razorpaySignature: 'mock_sig',
             sessionId: sessionId
           }).subscribe({
             next: () => {
               this.toast.success('Mock Payment successful! Session is confirmed.');
               this.loadSessions();
             }
           });
        }
        this.actionLoading = false;
      },
      error: () => {
        this.toast.error('Failed to initiate payment. Is order created?');
        this.actionLoading = false;
      }
    });
  }
}
