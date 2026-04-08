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
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss'
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
