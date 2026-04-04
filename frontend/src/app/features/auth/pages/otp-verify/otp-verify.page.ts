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
  template: `
    <div class="page">
      <div class="left-panel">
        <div class="brand-content">
          <div class="brand-logo"><span class="bolt">⚡</span></div>
          <h1>SkillSync</h1>
          <p>Verify your identity to complete registration</p>
          <div class="steps-preview">
            <div class="step-item done">
              <div class="step-circle"><span class="material-icons">check</span></div>
              <span>Form submitted</span>
            </div>
            <div class="step-item active">
              <div class="step-circle">2</div>
              <span>Verify your email</span>
            </div>
            <div class="step-item">
              <div class="step-circle">3</div>
              <span>Ready to login</span>
            </div>
          </div>
        </div>
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
      </div>

      <div class="right-panel">
        <div class="form-wrapper">
          <div class="mobile-logo">⚡ SkillSync</div>

          <div class="form-header">
            <h2>Verify your email</h2>
            <p>We sent a 6-digit code to <strong>{{ email }}</strong></p>
          </div>

          <div class="otp-section">
            <app-otp-input (otpComplete)="onOtpComplete($event)" />
            
            @if (authStore.error()) {
              <div class="error-banner">
                <span class="material-icons">error_outline</span>
                {{ authStore.error() }}
              </div>
            }

            <div class="actions">
              <button class="submit-btn" (click)="manualVerify()" [disabled]="!otp() || authStore.loading()">
                @if (authStore.loading()) { <mat-spinner diameter="22" /> }
                @else { <span>Verify OTP</span> }
              </button>
              <button class="resend-btn" (click)="resendOtp()" [disabled]="authStore.loading()">
                Didn't receive it? Resend OTP
              </button>
            </div>
          </div>

          <p class="login-link">Wait, I used the wrong email? <a routerLink="/auth/register">Go back</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }

    .left-panel {
      position: relative; overflow: hidden;
      background: linear-gradient(145deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%);
      display: flex; align-items: center; justify-content: center; padding: 48px;
    }
    .brand-content { position: relative; z-index: 2; color: white; max-width: 380px; }
    .brand-logo { width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 18px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); }
    .bolt { font-size: 32px; }
    .brand-content h1 { font-size: 38px; font-weight: 800; margin: 0 0 8px; letter-spacing: -1px; }
    .brand-content p { font-size: 16px; opacity: 0.8; margin: 0 0 40px; }

    .steps-preview { display: flex; flex-direction: column; gap: 20px; }
    .step-item { display: flex; align-items: center; gap: 14px; opacity: 0.6; transition: opacity 0.3s; }
    .step-item.active { opacity: 1; }
    .step-circle {
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; flex-shrink: 0;
    }
    .step-item.active .step-circle { background: white; color: #4f46e5; border-color: white; }
    .step-item.done .step-circle { background: #10b981; border-color: #10b981; }
    .step-item.done .step-circle .material-icons { font-size: 16px; color: white; }
    .step-item span:last-child { font-size: 14px; font-weight: 500; }

    .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.25; }
    .blob-1 { width: 280px; height: 280px; background: #818cf8; top: -60px; right: -60px; }
    .blob-2 { width: 200px; height: 200px; background: #c084fc; bottom: 40px; left: -40px; }

    .right-panel { background: #fafafa; display: flex; align-items: center; justify-content: center; padding: 48px 32px; }
    .form-wrapper { width: 100%; max-width: 420px; }
    .mobile-logo { display: none; font-size: 22px; font-weight: 800; color: #4f46e5; margin-bottom: 32px; }
    .form-header { margin-bottom: 28px; }
    .form-header h2 { font-size: 28px; font-weight: 800; color: #111827; margin: 0 0 6px; letter-spacing: -0.5px; }
    .form-header p { color: #6b7280; font-size: 14px; margin: 0; }

    .otp-section { display: flex; flex-direction: column; align-items: center; gap: 24px; }
    .error-banner { display: flex; align-items: center; gap: 8px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 10px 14px; border-radius: 10px; font-size: 14px; width: 100%; }
    .error-banner .material-icons { font-size: 18px; }

    .actions { width: 100%; display: flex; flex-direction: column; gap: 12px; }
    .submit-btn { height: 52px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 15px rgba(79,70,229,0.35); }
    .submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .resend-btn { background: none; border: none; color: #4f46e5; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: underline; }
    .resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .login-link { text-align: center; font-size: 14px; color: #6b7280; margin: 32px 0 0; }
    .login-link a { color: #4f46e5; font-weight: 600; text-decoration: none; margin-left: 4px; }
    .login-link a:hover { text-decoration: underline; }

    @media (max-width: 900px) {
      .page { grid-template-columns: 1fr; }
      .left-panel { display: none; }
      .right-panel { background: white; padding: 32px 20px; }
      .mobile-logo { display: block; }
    }
  `]
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
