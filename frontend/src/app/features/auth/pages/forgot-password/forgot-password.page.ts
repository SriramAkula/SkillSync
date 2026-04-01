import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { OtpInputComponent } from '../../components/otp-input/otp-input.component';

type Step = 'email' | 'otp' | 'reset' | 'done';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatProgressSpinnerModule, OtpInputComponent],
  template: `
    <div class="page">
      <div class="card">
        <a routerLink="/auth/login" class="back-link">
          <span class="material-icons">arrow_back</span> Back to login
        </a>

        @if (step() !== 'done') {
          <div class="progress-bar">
            <div class="progress-fill" [style.width]="progressWidth()"></div>
          </div>
        }

        <!-- Email Step -->
        @if (step() === 'email') {
          <div class="step-header">
            <div class="step-icon purple"><span class="material-icons">lock_reset</span></div>
            <h2>Forgot password?</h2>
            <p>Enter your email and we'll send you a reset code</p>
          </div>
          <form [formGroup]="emailForm" (ngSubmit)="sendOtp()" class="form">
            <div class="input-group">
              <label class="input-label">Email address</label>
              <div class="input-wrapper" [class.focused]="focused()">
                <span class="material-icons input-icon">email</span>
                <input type="email" formControlName="email" placeholder="you@example.com"
                  (focus)="focused.set(true)" (blur)="focused.set(false)" />
              </div>
            </div>
            @if (error()) { <div class="error-banner"><span class="material-icons">error_outline</span>{{ error() }}</div> }
            <button type="submit" class="submit-btn" [disabled]="emailForm.invalid || loading()">
              @if (loading()) { <mat-spinner diameter="22" /> }
              @else { <span>Send Reset Code</span><span class="material-icons">arrow_forward</span> }
            </button>
          </form>
        }

        <!-- OTP Step -->
        @if (step() === 'otp') {
          <div class="step-header">
            <div class="step-icon blue"><span class="material-icons">mark_email_read</span></div>
            <h2>Check your email</h2>
            <p>We sent a 6-digit code to <strong>{{ emailForm.value.email }}</strong></p>
          </div>
          <div class="otp-section">
            <app-otp-input (otpComplete)="verifyOtp($event)" />
            @if (error()) { <div class="error-banner"><span class="material-icons">error_outline</span>{{ error() }}</div> }
            <button class="resend-btn" (click)="sendOtp()">Resend code</button>
          </div>
        }

        <!-- Reset Step -->
        @if (step() === 'reset') {
          <div class="step-header">
            <div class="step-icon green"><span class="material-icons">lock</span></div>
            <h2>Set new password</h2>
            <p>Choose a strong password for your account</p>
          </div>
          <form [formGroup]="resetForm" (ngSubmit)="resetPassword()" class="form">
            <div class="input-group">
              <label class="input-label">New Password</label>
              <div class="input-wrapper" [class.focused]="focused()">
                <span class="material-icons input-icon">lock</span>
                <input [type]="showPwd() ? 'text' : 'password'" formControlName="newPassword" placeholder="Min 8 characters"
                  (focus)="focused.set(true)" (blur)="focused.set(false)" />
                <button type="button" class="toggle-pwd" (click)="showPwd.set(!showPwd())">
                  <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>
            @if (error()) { <div class="error-banner"><span class="material-icons">error_outline</span>{{ error() }}</div> }
            <button type="submit" class="submit-btn" [disabled]="resetForm.invalid || loading()">
              @if (loading()) { <mat-spinner diameter="22" /> }
              @else { <span>Reset Password</span><span class="material-icons">arrow_forward</span> }
            </button>
          </form>
        }

        <!-- Done Step -->
        @if (step() === 'done') {
          <div class="done-state">
            <div class="success-circle">
              <span class="material-icons">check</span>
            </div>
            <h2>Password reset!</h2>
            <p>Your password has been updated successfully.</p>
            <a routerLink="/auth/login" class="submit-btn" style="text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px;">
              <span>Sign In Now</span><span class="material-icons">arrow_forward</span>
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(145deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%); padding: 16px; }
    .card { background: white; border-radius: 24px; padding: 40px; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }

    .back-link { display: inline-flex; align-items: center; gap: 6px; color: #6b7280; font-size: 14px; text-decoration: none; margin-bottom: 24px; transition: color 0.15s; }
    .back-link:hover { color: #4f46e5; }
    .back-link .material-icons { font-size: 18px; }

    .progress-bar { height: 4px; background: #e5e7eb; border-radius: 2px; margin-bottom: 32px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #7c3aed); border-radius: 2px; transition: width 0.4s ease; }

    .step-header { text-align: center; margin-bottom: 28px; }
    .step-icon { width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .step-icon .material-icons { font-size: 28px; color: white; }
    .step-icon.purple { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
    .step-icon.blue { background: linear-gradient(135deg, #0ea5e9, #2563eb); }
    .step-icon.green { background: linear-gradient(135deg, #10b981, #059669); }
    .step-header h2 { font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 8px; }
    .step-header p { color: #6b7280; font-size: 14px; margin: 0; }

    .form { display: flex; flex-direction: column; gap: 18px; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-label { font-size: 13px; font-weight: 600; color: #374151; }
    .input-wrapper { display: flex; align-items: center; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 0 14px; height: 52px; transition: border-color 0.2s, box-shadow 0.2s; }
    .input-wrapper.focused { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); background: white; }
    .input-icon { font-size: 18px; color: #9ca3af; margin-right: 10px; }
    .input-wrapper.focused .input-icon { color: #4f46e5; }
    .input-wrapper input { flex: 1; border: none; outline: none; font-size: 15px; color: #111827; background: transparent; }
    .input-wrapper input::placeholder { color: #9ca3af; }
    .toggle-pwd { background: none; border: none; cursor: pointer; padding: 4px; color: #9ca3af; display: flex; align-items: center; }
    .toggle-pwd .material-icons { font-size: 20px; }

    .error-banner { display: flex; align-items: center; gap: 8px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 10px 14px; border-radius: 10px; font-size: 14px; }
    .error-banner .material-icons { font-size: 18px; }

    .submit-btn { height: 52px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(79,70,229,0.35); transition: opacity 0.2s, transform 0.1s; }
    .submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .submit-btn .material-icons { font-size: 20px; }

    .otp-section { display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .resend-btn { background: none; border: none; color: #4f46e5; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: underline; }

    .done-state { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
    .success-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(16,185,129,0.35); }
    .success-circle .material-icons { font-size: 36px; color: white; }
    .done-state h2 { font-size: 24px; font-weight: 800; color: #111827; margin: 0; }
    .done-state p { color: #6b7280; font-size: 14px; margin: 0; }
    .done-state .submit-btn { width: 100%; margin-top: 8px; }

    @media (max-width: 480px) { .card { padding: 28px 20px; } }
  `]
})
export class ForgotPasswordPage {
  private readonly authService = inject(AuthService);
  readonly step = signal<Step>('email');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly focused = signal(false);
  readonly showPwd = signal(false);
  private readonly fb = inject(FormBuilder);

  readonly emailForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  readonly resetForm = this.fb.group({ newPassword: ['', [Validators.required, Validators.minLength(8)]] });

  progressWidth() { return { email: '33%', otp: '66%', reset: '100%', done: '100%' }[this.step()]; }

  sendOtp(): void {
    this.loading.set(true); this.error.set(null);
    this.authService.sendForgotPasswordOtp(this.emailForm.value.email!).subscribe({
      next: () => { this.loading.set(false); this.step.set('otp'); },
      error: (e) => { this.loading.set(false); this.error.set(e.error?.message ?? 'Failed to send OTP'); }
    });
  }

  verifyOtp(otp: string): void {
    this.loading.set(true); this.error.set(null);
    this.authService.verifyForgotPasswordOtp(this.emailForm.value.email!, otp).subscribe({
      next: () => { this.loading.set(false); this.step.set('reset'); },
      error: (e) => { this.loading.set(false); this.error.set(e.error?.message ?? 'Invalid OTP'); }
    });
  }

  resetPassword(): void {
    this.loading.set(true); this.error.set(null);
    this.authService.resetPassword(this.emailForm.value.email!, this.resetForm.value.newPassword!).subscribe({
      next: () => { this.loading.set(false); this.step.set('done'); },
      error: (e) => { this.loading.set(false); this.error.set(e.error?.message ?? 'Reset failed'); }
    });
  }
}
