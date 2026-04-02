import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../../core/auth/auth.store';
import { AuthService } from '../../../../core/services/auth.service';
import { OtpInputComponent } from '../../components/otp-input/otp-input.component';

type Step = 'email' | 'otp' | 'password';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatProgressSpinnerModule, OtpInputComponent],
  template: `
    <div class="page">

      <!-- Left Panel -->
      <div class="left-panel">
        <div class="brand-content">
          <div class="brand-logo"><span class="bolt">⚡</span></div>
          <h1>SkillSync</h1>
          <p>Start your learning journey today</p>
          <div class="steps-preview">
            @for (s of steps; track s.num) {
              <div class="step-item"
                   [class.active]="stepIndex() >= s.num"
                   [class.done]="stepIndex() > s.num">
                <div class="step-circle">
                  @if (stepIndex() > s.num) {
                    <span class="material-icons">check</span>
                  } @else {
                    {{ s.num }}
                  }
                </div>
                <span>{{ s.label }}</span>
              </div>
            }
          </div>
        </div>
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
      </div>

      <!-- Right Panel -->
      <div class="right-panel">
        <div class="form-wrapper">
          <div class="mobile-logo">⚡ SkillSync</div>

          <div class="form-header">
            <h2>{{ stepTitle() }}</h2>
            <p>{{ stepSubtitle() }}</p>
          </div>

          <!-- ── Step 1: Email ── -->
          @if (step() === 'email') {
            <form [formGroup]="emailForm" (ngSubmit)="sendOtp()" class="form">
              <div class="input-group">
                <label class="input-label">Email address</label>
                <div class="input-wrapper"
                     [class.focused]="emailFocused()"
                     [class.has-error]="emailForm.get('email')?.invalid && emailForm.get('email')?.touched">
                  <span class="material-icons input-icon">email</span>
                  <input type="email" formControlName="email"
                    placeholder="you@example.com"
                    autocomplete="email"
                    (focus)="emailFocused.set(true)"
                    (blur)="emailFocused.set(false)" />
                </div>
                @if (emailForm.get('email')?.invalid && emailForm.get('email')?.touched) {
                  <span class="field-error">Enter a valid email address</span>
                }
              </div>

              @if (errorMsg()) {
                <div class="error-banner">
                  <span class="material-icons">error_outline</span>
                  {{ errorMsg() }}
                </div>
              }

              <button type="submit" class="submit-btn"
                      [disabled]="emailForm.invalid || loading()">
                @if (loading()) {
                  <mat-spinner diameter="22" />
                } @else {
                  <span>Send OTP</span>
                  <span class="material-icons">arrow_forward</span>
                }
              </button>
            </form>
          }

          <!-- ── Step 2: OTP ── -->
          @if (step() === 'otp') {
            <div class="otp-section">
              <div class="otp-email-badge">
                <span class="material-icons">email</span>
                {{ emailForm.value.email }}
              </div>
              <p class="otp-hint">Enter the 6-digit code sent to your inbox</p>

              <app-otp-input
                (otpChange)="currentOtp.set($event)"
                (otpComplete)="currentOtp.set($event)" />

              @if (errorMsg()) {
                <div class="error-banner">
                  <span class="material-icons">error_outline</span>
                  {{ errorMsg() }}
                </div>
              }

              <button class="submit-btn verify-btn"
                      [disabled]="currentOtp().length < 6 || loading()"
                      (click)="verifyOtp()">
                @if (loading()) {
                  <mat-spinner diameter="22" />
                  <span>Verifying...</span>
                } @else {
                  <span class="material-icons">verified</span>
                  <span>Verify OTP</span>
                }
              </button>

              <button class="resend-btn" [disabled]="loading()" (click)="sendOtp()">
                Didn't receive it? Resend OTP
              </button>
            </div>
          }

          <!-- ── Step 3: Set Password ── -->
          @if (step() === 'password') {
            <form [formGroup]="passwordForm" (ngSubmit)="register()" class="form">

              <!-- Verified email — read-only -->
              <div class="input-group">
                <label class="input-label">Email address</label>
                <div class="input-wrapper verified-wrapper">
                  <span class="material-icons input-icon">email</span>
                  <input type="email" [value]="emailForm.value.email" readonly />
                  <span class="material-icons verified-icon">verified</span>
                </div>
              </div>

              <div class="input-group">
                <label class="input-label">Password</label>
                <div class="input-wrapper" [class.focused]="pwdFocused()">
                  <span class="material-icons input-icon">lock</span>
                  <input [type]="showPwd() ? 'text' : 'password'"
                    formControlName="password"
                    placeholder="Min 6 characters"
                    autocomplete="new-password"
                    (focus)="pwdFocused.set(true)"
                    (blur)="pwdFocused.set(false)" />
                  <button type="button" class="toggle-pwd" (click)="showPwd.set(!showPwd())">
                    <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
                @if (passwordForm.get('password')?.invalid && passwordForm.get('password')?.touched) {
                  <span class="field-error">Password must be at least 6 characters</span>
                }
              </div>

              <div class="input-group">
                <label class="input-label">Confirm Password</label>
                <div class="input-wrapper" [class.focused]="confirmFocused()">
                  <span class="material-icons input-icon">lock_outline</span>
                  <input [type]="showPwd() ? 'text' : 'password'"
                    formControlName="confirmPassword"
                    placeholder="Re-enter password"
                    autocomplete="new-password"
                    (focus)="confirmFocused.set(true)"
                    (blur)="confirmFocused.set(false)" />
                </div>
                @if (passwordForm.get('confirmPassword')?.touched && passwordMismatch()) {
                  <span class="field-error">Passwords do not match</span>
                }
              </div>

              @if (errorMsg()) {
                <div class="error-banner">
                  <span class="material-icons">error_outline</span>
                  {{ errorMsg() }}
                </div>
              }

              <button type="submit" class="submit-btn"
                      [disabled]="passwordForm.invalid || passwordMismatch() || loading()">
                @if (loading()) {
                  <mat-spinner diameter="22" />
                  <span>Creating account...</span>
                } @else {
                  <span>Create Account</span>
                  <span class="material-icons">arrow_forward</span>
                }
              </button>
            </form>
          }

          <p class="login-link">
            Already have an account? <a routerLink="/auth/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }

    /* ── Left Panel ── */
    .left-panel {
      position: relative; overflow: hidden;
      background: linear-gradient(145deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%);
      display: flex; align-items: center; justify-content: center; padding: 48px;
    }
    .brand-content { position: relative; z-index: 2; color: white; max-width: 380px; }
    .brand-logo {
      width: 64px; height: 64px; background: rgba(255,255,255,0.15);
      border-radius: 18px; display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px; backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    }
    .bolt { font-size: 32px; }
    .brand-content h1 { font-size: 38px; font-weight: 800; margin: 0 0 8px; letter-spacing: -1px; }
    .brand-content p  { font-size: 16px; opacity: 0.8; margin: 0 0 40px; }

    .steps-preview { display: flex; flex-direction: column; gap: 20px; }
    .step-item { display: flex; align-items: center; gap: 14px; opacity: 0.5; transition: opacity 0.3s; }
    .step-item.active { opacity: 1; }
    .step-circle {
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; flex-shrink: 0;
    }
    .step-item.active .step-circle { background: white; color: #4f46e5; border-color: white; }
    .step-item.done  .step-circle { background: #10b981; border-color: #10b981; }
    .step-item.done  .step-circle .material-icons { font-size: 16px; color: white; }
    .step-item span:last-child { font-size: 14px; font-weight: 500; }

    .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.25; }
    .blob-1 { width: 280px; height: 280px; background: #818cf8; top: -60px; right: -60px; }
    .blob-2 { width: 200px; height: 200px; background: #c084fc; bottom: 40px; left: -40px; }

    /* ── Right Panel ── */
    .right-panel {
      background: #fafafa; display: flex;
      align-items: center; justify-content: center; padding: 48px 32px;
    }
    .form-wrapper { width: 100%; max-width: 420px; }
    .mobile-logo { display: none; font-size: 22px; font-weight: 800; color: #4f46e5; margin-bottom: 32px; }
    .form-header { margin-bottom: 28px; }
    .form-header h2 { font-size: 28px; font-weight: 800; color: #111827; margin: 0 0 6px; letter-spacing: -0.5px; }
    .form-header p  { color: #6b7280; font-size: 14px; margin: 0; }

    /* ── Form ── */
    .form { display: flex; flex-direction: column; gap: 18px; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-label { font-size: 13px; font-weight: 600; color: #374151; }

    .input-wrapper {
      display: flex; align-items: center; background: white;
      border: 1.5px solid #e5e7eb; border-radius: 12px;
      padding: 0 14px; height: 52px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input-wrapper.focused   { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    .input-wrapper.has-error { border-color: #ef4444; }

    .input-icon { font-size: 18px; color: #9ca3af; margin-right: 10px; flex-shrink: 0; }
    .input-wrapper.focused .input-icon { color: #4f46e5; }

    .input-wrapper input {
      flex: 1; border: none; outline: none;
      font-size: 15px; color: #111827; background: transparent;
    }
    .input-wrapper input::placeholder { color: #9ca3af; }

    .toggle-pwd {
      background: none; border: none; cursor: pointer;
      padding: 4px; color: #9ca3af; display: flex; align-items: center;
    }
    .toggle-pwd .material-icons { font-size: 20px; }

    .field-error { font-size: 12px; color: #ef4444; }

    /* Verified email */
    .verified-wrapper { background: #f0fdf4; border-color: #bbf7d0; }
    .verified-wrapper input { color: #15803d; font-weight: 500; cursor: not-allowed; }
    .verified-icon { font-size: 18px; color: #16a34a; flex-shrink: 0; }

    /* Banners */
    .error-banner {
      display: flex; align-items: center; gap: 8px;
      background: #fef2f2; color: #dc2626;
      border: 1px solid #fecaca; padding: 10px 14px;
      border-radius: 10px; font-size: 14px;
      width: 100%; box-sizing: border-box;
    }
    .error-banner .material-icons { font-size: 18px; flex-shrink: 0; }

    /* Submit button */
    .submit-btn {
      height: 52px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; border: none; border-radius: 12px;
      font-size: 16px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: opacity 0.2s, transform 0.1s;
      box-shadow: 0 4px 15px rgba(79,70,229,0.35);
    }
    .submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .submit-btn .material-icons { font-size: 20px; }

    /* OTP section */
    .otp-section {
      display: flex; flex-direction: column;
      align-items: center; gap: 20px; width: 100%;
    }
    .otp-email-badge {
      display: flex; align-items: center; gap: 8px;
      background: #eef2ff; color: #4f46e5;
      border: 1px solid #c7d2fe; border-radius: 10px;
      padding: 8px 14px; font-size: 14px; font-weight: 600;
      width: 100%; box-sizing: border-box;
    }
    .otp-email-badge .material-icons { font-size: 16px; }
    .otp-hint { color: #6b7280; font-size: 14px; text-align: center; margin: 0; }
    .verify-btn { width: 100%; }
    .resend-btn {
      background: none; border: none; color: #4f46e5;
      font-size: 14px; font-weight: 500; cursor: pointer;
      text-decoration: underline;
    }
    .resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .login-link { text-align: center; font-size: 14px; color: #6b7280; margin: 24px 0 0; }
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
export class RegisterPage implements OnInit {
  readonly authStore   = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly fb   = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly step          = signal<Step>('email');
  readonly loading       = signal(false);
  readonly errorMsg      = signal<string | null>(null);
  readonly currentOtp    = signal('');
  readonly showPwd       = signal(false);
  readonly emailFocused  = signal(false);
  readonly pwdFocused    = signal(false);
  readonly confirmFocused = signal(false);

  readonly steps = [
    { num: 1, label: 'Verify your email' },
    { num: 2, label: 'Enter OTP code'    },
    { num: 3, label: 'Set your password' }
  ];

  readonly emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  readonly passwordForm = this.fb.group({
    password:        ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  readonly stepIndex    = () => ({ email: 1, otp: 2, password: 3 }[this.step()]);
  readonly stepTitle    = () => ({
    email:    'Create your account',
    otp:      'Verify your email',
    password: 'Set your password'
  }[this.step()]);
  readonly stepSubtitle = () => ({
    email:    'Enter your email to get started',
    otp:      'Check your inbox for the 6-digit code',
    password: 'Choose a strong password for your account'
  }[this.step()]);

  readonly passwordMismatch = () => {
    const f = this.passwordForm.value;
    return !!f.confirmPassword && f.password !== f.confirmPassword;
  };

  ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) this.emailForm.patchValue({ email: emailParam });
  }

  // ── Step 1: Send OTP ──────────────────────────────────────────

  sendOtp(): void {
    if (this.emailForm.invalid) return;
    this.loading.set(true);
    this.errorMsg.set(null);

    this.authService.sendOtp(this.emailForm.value.email!).subscribe({
      next: () => {
        this.loading.set(false);
        this.currentOtp.set('');
        this.step.set('otp');          // ← advance to OTP step
      },
      error: (e) => {
        this.loading.set(false);
        this.errorMsg.set(e?.error?.message ?? 'Failed to send OTP. Please try again.');
      }
    });
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────

  verifyOtp(): void {
    const otp = this.currentOtp();
    if (otp.length < 6) return;
    this.loading.set(true);
    this.errorMsg.set(null);

    this.authService.verifyOtp(this.emailForm.value.email!, otp).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('password');     // ← advance to password step
      },
      error: (e) => {
        this.loading.set(false);
        this.errorMsg.set(e?.error?.message ?? 'Invalid or expired OTP. Please try again.');
      }
    });
  }

  // ── Step 3: Register ──────────────────────────────────────────

  register(): void {
    if (this.passwordForm.invalid || this.passwordMismatch()) return;
    this.loading.set(true);
    this.errorMsg.set(null);

    // Backend RegisterRequest only needs: email + password
    this.authStore.register({
      email:    this.emailForm.value.email!,
      password: this.passwordForm.value.password!
    } as any);

    // Watch for authStore error after register attempt
    const checkError = setInterval(() => {
      if (!this.authStore.loading()) {
        this.loading.set(false);
        if (this.authStore.error()) {
          this.errorMsg.set(this.authStore.error());
        }
        clearInterval(checkError);
      }
    }, 200);
  }
}
