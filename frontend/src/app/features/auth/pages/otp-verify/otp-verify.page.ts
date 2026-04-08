import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../../core/auth/auth.store';
import { OtpInputComponent } from '../../components/otp-input/otp-input.component';

@Component({
  selector: 'app-otp-verify-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, OtpInputComponent],
  templateUrl: './otp-verify.page.html',
  styleUrl: './otp-verify.page.scss'
})
export class OtpVerifyPage implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);

  email = '';
  otp = signal('');

  ngOnInit() {
    this.email = sessionStorage.getItem('reg_email') || window.history.state?.email || '';
    if (!this.email) {
      console.warn('No email state found');
      this.router.navigate(['/auth/register']);
    }
  }

  onOtpComplete(otp: string) {
    this.otp.set(otp);
    this.verifyOtp(otp);
  }

  manualVerify() {
    if (this.otp().length === 6) {
      this.verifyOtp(this.otp());
    }
  }

  private verifyOtp(otp: string) {
    this.authStore.verifyOtp({ email: this.email, otp });
    
    // Check verification status
    const checkInterval: number = window.setInterval(() => {
      if (!this.authStore.loading()) {
        window.clearInterval(checkInterval);
        if (this.authStore.otpVerified()) {
          this.router.navigate(['/auth/register-details']);
        }
      }
    }, 100);
  }

  resendOtp() {
    this.authStore.sendOtp(this.email);
  }
}
