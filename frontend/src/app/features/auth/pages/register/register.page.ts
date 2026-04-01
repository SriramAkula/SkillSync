import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../../core/auth/auth.store';
import { OtpInputComponent } from '../../components/otp-input/otp-input.component';

type Step = 'email' | 'otp' | 'details';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatProgressSpinnerModule, OtpInputComponent],
  template: `
    <div class="page">
      <div class="left-panel">
        <div class="brand-content">
          <div class="brand-logo"><span class="bolt">⚡</span></div>
          <h1>SkillSync</h1>
          <p>Start your learning journey today</p>
          <div class="steps-preview">
            @for (s of steps; track s.num) {
              <div class="step-item" [class.active]="stepIndex() >= s.num" [class.done]="stepIndex() > s.num">
                <div class="step-circle">
                  @if (stepIndex() > s.num) { <span class="material-icons">check</span> }
                  @else { {{ s.num }} }
                </div>
                <span>{{ s.label }}</span>
              </div>
            }
          </div>
        </div>
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
      </div>

      <div class="right-panel">
        <div class="form-wrapper">
          <div class="mobile-logo">⚡ SkillSync</div>

          <div class="form-header">
            <h2>{{ stepTitle() }}</h2>
            <p>{{ stepSubtitle() }}</p>
          </div>

          <!-- Step 1: Email -->
          @if (step() === 'email') {
            <form [formGroup]="emailForm" (ngSubmit)="sendOtp()" class="form">
              <div class="input-group">
                <label class="input-label">Email address</label>
                <div class="input-wrapper" [class.focused]="emailFocused()" [class.error]="emailForm.get('email')?.invalid && emailForm.get('email')?.touched">
                  <span class="material-icons input-icon">email</span>
                  <input type="email" formControlName="email" placeholder="you@example.com"
                    (focus)="emailFocused.set(true)" (blur)="emailFocused.set(false)" />
                </div>
                @if (emailForm.get('email')?.invalid && emailForm.get('email')?.touched) {
                  <span class="field-error">Enter a valid email</span>
                }
              </div>
              @if (authStore.error()) { <div class="error-banner"><span class="material-icons">error_outline</span>{{ authStore.error() }}</div> }
              <button type="submit" class="submit-btn" [disabled]="emailForm.invalid || authStore.loading()">
                @if (authStore.loading()) { <mat-spinner diameter="22" /> }
                @else { <span>Send OTP</span><span class="material-icons">arrow_forward</span> }
              </button>
            </form>
          }

          <!-- Step 2: OTP -->
          @if (step() === 'otp') {
            <div class="otp-section">
              <p class="otp-hint">We sent a 6-digit code to <strong>{{ emailForm.value.email }}</strong></p>
              <app-otp-input (otpComplete)="verifyOtp($event)" />
              @if (authStore.error()) { <div class="error-banner"><span class="material-icons">error_outline</span>{{ authStore.error() }}</div> }
              <button class="resend-btn" (click)="sendOtp()">Didn't receive it? Resend OTP</button>
            </div>
          }

          <!-- Step 3: Details -->
          @if (step() === 'details') {
            <form [formGroup]="detailsForm" (ngSubmit)="register()" class="form">
              <div class="input-group">
                <label class="input-label">Username</label>
                <div class="input-wrapper" [class.focused]="userFocused()">
                  <span class="material-icons input-icon">person</span>
                  <input type="text" formControlName="username" placeholder="Choose a username"
                    (focus)="userFocused.set(true)" (blur)="userFocused.set(false)" />
                </div>
              </div>
              <div class="input-group">
                <label class="input-label">Password</label>
                <div class="input-wrapper" [class.focused]="pwdFocused()">
                  <span class="material-icons input-icon">lock</span>
                  <input [type]="showPwd() ? 'text' : 'password'" formControlName="password" placeholder="Min 8 characters"
                    (focus)="pwdFocused.set(true)" (blur)="pwdFocused.set(false)" />
                  <button type="button" class="toggle-pwd" (click)="showPwd.set(!showPwd())">
                    <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>
              @if (authStore.error()) { <div class="error-banner"><span class="material-icons">error_outline</span>{{ authStore.error() }}</div> }
              <button type="submit" class="submit-btn" [disabled]="detailsForm.invalid || authStore.loading()">
                @if (authStore.loading()) { <mat-spinner diameter="22" /> }
                @else { <span>Create Account</span><span class="material-icons">arrow_forward</span> }
              </button>
            </form>
          }

          <p class="login-link">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
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

    .form { display: flex; flex-direction: column; gap: 18px; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-label { font-size: 13px; font-weight: 600; color: #374151; }
    .input-wrapper { display: flex; align-items: center; background: white; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 0 14px; height: 52px; transition: border-color 0.2s, box-shadow 0.2s; }
    .input-wrapper.focused { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    .input-wrapper.error { border-color: #ef4444; }
    .input-icon { font-size: 18px; color: #9ca3af; margin-right: 10px; }
    .input-wrapper.focused .input-icon { color: #4f46e5; }
    .input-wrapper input { flex: 1; border: none; outline: none; font-size: 15px; color: #111827; background: transparent; }
    .input-wrapper input::placeholder { color: #9ca3af; }
    .toggle-pwd { background: none; border: none; cursor: pointer; padding: 4px; color: #9ca3af; display: flex; align-items: center; }
    .toggle-pwd .material-icons { font-size: 20px; }
    .field-error { font-size: 12px; color: #ef4444; }

    .error-banner { display: flex; align-items: center; gap: 8px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 10px 14px; border-radius: 10px; font-size: 14px; }
    .error-banner .material-icons { font-size: 18px; }

    .submit-btn { height: 52px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(79,70,229,0.35); }
    .submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .submit-btn .material-icons { font-size: 20px; }

    .otp-section { display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .otp-hint { color: #6b7280; font-size: 14px; text-align: center; margin: 0; }
    .resend-btn { background: none; border: none; color: #4f46e5; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: underline; }

    .login-link { text-align: center; font-size: 14px; color: #6b7280; margin: 20px 0 0; }
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
export class RegisterPage {
  readonly authStore = inject(AuthStore);
  readonly step = signal<Step>('email');
  readonly showPwd = signal(false);
  readonly emailFocused = signal(false);
  readonly userFocused = signal(false);
  readonly pwdFocused = signal(false);
  private readonly fb = inject(FormBuilder);

  readonly steps = [
    { num: 1, label: 'Verify your email' },
    { num: 2, label: 'Enter OTP code' },
    { num: 3, label: 'Set up your account' }
  ];

  readonly emailForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  readonly detailsForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly stepIndex = () => ({ email: 1, otp: 2, details: 3 }[this.step()]);
  readonly stepTitle = () => ({ email: 'Create your account', otp: 'Verify your email', details: 'Almost there!' }[this.step()]);
  readonly stepSubtitle = () => ({ email: 'Enter your email to get started', otp: 'Check your inbox for the code', details: 'Choose a username and password' }[this.step()]);

  sendOtp(): void {
    if (this.emailForm.invalid) return;
    this.authStore.sendOtp(this.emailForm.value.email!);
    setTimeout(() => { if (!this.authStore.error()) this.step.set('otp'); }, 600);
  }

  verifyOtp(otp: string): void {
    this.authStore.verifyOtp({ email: this.emailForm.value.email!, otp });
    setTimeout(() => { if (!this.authStore.error()) this.step.set('details'); }, 600);
  }

  register(): void {
    if (this.detailsForm.invalid) return;
    this.authStore.register({ email: this.emailForm.value.email!, ...this.detailsForm.getRawValue() } as any);
  }
}
