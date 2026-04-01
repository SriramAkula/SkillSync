import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { AuthStore } from '../../../../core/auth/auth.store';
import { GoogleLoginButtonComponent } from '../../components/google-login/google-login-button.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatProgressSpinnerModule, MatIconModule, MatRippleModule,
    GoogleLoginButtonComponent
  ],
  template: `
    <div class="page">

      <!-- Left Panel: Branding -->
      <div class="left-panel">
        <div class="brand-content">
          <div class="brand-logo">
            <span class="bolt">⚡</span>
          </div>
          <h1 class="brand-name">SkillSync</h1>
          <p class="brand-tagline">Connect. Learn. Grow.</p>

          <div class="features">
            @for (f of features; track f.icon) {
              <div class="feature-item">
                <div class="feature-icon">
                  <span class="material-icons">{{ f.icon }}</span>
                </div>
                <div>
                  <strong>{{ f.title }}</strong>
                  <p>{{ f.desc }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Decorative blobs -->
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
      </div>

      <!-- Right Panel: Form -->
      <div class="right-panel">
        <div class="form-wrapper">

          <!-- Mobile logo -->
          <div class="mobile-logo">⚡ SkillSync</div>

          <div class="form-header">
            <h2>Welcome back</h2>
            <p>Sign in to continue your learning journey</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">

            <!-- Email -->
            <div class="input-group">
              <label class="input-label">Email address</label>
              <div class="input-wrapper" [class.focused]="emailFocused()" [class.error]="form.get('email')?.invalid && form.get('email')?.touched">
                <span class="material-icons input-icon">email</span>
                <input
                  type="email"
                  formControlName="email"
                  placeholder="you@example.com"
                  autocomplete="email"
                  (focus)="emailFocused.set(true)"
                  (blur)="emailFocused.set(false)"
                />
              </div>
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <span class="field-error">Enter a valid email address</span>
              }
            </div>

            <!-- Password -->
            <div class="input-group">
              <div class="label-row">
                <label class="input-label">Password</label>
                <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
              </div>
              <div class="input-wrapper" [class.focused]="pwdFocused()" [class.error]="form.get('password')?.invalid && form.get('password')?.touched">
                <span class="material-icons input-icon">lock</span>
                <input
                  [type]="showPwd() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  (focus)="pwdFocused.set(true)"
                  (blur)="pwdFocused.set(false)"
                />
                <button type="button" class="toggle-pwd" (click)="showPwd.set(!showPwd())">
                  <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <span class="field-error">Password is required</span>
              }
            </div>

            <!-- Error Banner -->
            @if (authStore.error()) {
              <div class="error-banner">
                <span class="material-icons">error_outline</span>
                {{ authStore.error() }}
              </div>
            }

            <!-- Submit -->
            <button type="submit" class="submit-btn" [disabled]="form.invalid || authStore.loading()">
              @if (authStore.loading()) {
                <mat-spinner diameter="22" />
              } @else {
                <span>Sign In</span>
                <span class="material-icons">arrow_forward</span>
              }
            </button>

            <!-- Divider -->
            <div class="divider"><span>or continue with</span></div>

            <!-- Google -->
            <app-google-login-button />

            <!-- Register link -->
            <p class="register-link">
              Don't have an account?
              <a routerLink="/auth/register">Create one free</a>
            </p>

          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Page Layout ─────────────────────────────────────────────────────── */
    .page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    /* ── Left Panel ──────────────────────────────────────────────────────── */
    .left-panel {
      position: relative;
      background: linear-gradient(145deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 48px;
    }

    .brand-content {
      position: relative;
      z-index: 2;
      color: white;
      max-width: 400px;
    }

    .brand-logo {
      width: 72px; height: 72px;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
    }

    .bolt { font-size: 36px; }

    .brand-name {
      font-size: 42px; font-weight: 800;
      margin: 0 0 8px;
      letter-spacing: -1px;
    }

    .brand-tagline {
      font-size: 18px;
      opacity: 0.85;
      margin: 0 0 48px;
      font-weight: 300;
    }

    .features { display: flex; flex-direction: column; gap: 24px; }

    .feature-item {
      display: flex; align-items: flex-start; gap: 16px;
    }

    .feature-icon {
      width: 44px; height: 44px; flex-shrink: 0;
      background: rgba(255,255,255,0.15);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(10px);
    }

    .feature-icon .material-icons { font-size: 22px; color: white; }

    .feature-item strong { display: block; font-size: 15px; margin-bottom: 2px; }
    .feature-item p { margin: 0; font-size: 13px; opacity: 0.75; }

    /* Decorative blobs */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.3;
    }
    .blob-1 {
      width: 300px; height: 300px;
      background: #818cf8;
      top: -80px; right: -80px;
    }
    .blob-2 {
      width: 200px; height: 200px;
      background: #c084fc;
      bottom: 60px; left: -60px;
    }
    .blob-3 {
      width: 150px; height: 150px;
      background: #38bdf8;
      bottom: 200px; right: 40px;
    }

    /* ── Right Panel ─────────────────────────────────────────────────────── */
    .right-panel {
      background: #fafafa;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 32px;
    }

    .form-wrapper {
      width: 100%;
      max-width: 420px;
    }

    .mobile-logo {
      display: none;
      font-size: 22px; font-weight: 800;
      color: #4f46e5;
      margin-bottom: 32px;
    }

    .form-header { margin-bottom: 32px; }
    .form-header h2 {
      font-size: 30px; font-weight: 800;
      color: #111827; margin: 0 0 6px;
      letter-spacing: -0.5px;
    }
    .form-header p { color: #6b7280; font-size: 15px; margin: 0; }

    /* ── Form ────────────────────────────────────────────────────────────── */
    .auth-form { display: flex; flex-direction: column; gap: 20px; }

    .input-group { display: flex; flex-direction: column; gap: 6px; }

    .input-label {
      font-size: 13px; font-weight: 600;
      color: #374151; letter-spacing: 0.3px;
    }

    .label-row {
      display: flex; justify-content: space-between; align-items: center;
    }

    .forgot-link {
      font-size: 13px; color: #4f46e5;
      text-decoration: none; font-weight: 500;
    }
    .forgot-link:hover { text-decoration: underline; }

    .input-wrapper {
      display: flex; align-items: center;
      background: white;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      padding: 0 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
      height: 52px;
    }
    .input-wrapper.focused {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    .input-wrapper.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
    }

    .input-icon {
      font-size: 18px; color: #9ca3af;
      margin-right: 10px; flex-shrink: 0;
    }
    .input-wrapper.focused .input-icon { color: #4f46e5; }

    .input-wrapper input {
      flex: 1; border: none; outline: none;
      font-size: 15px; color: #111827;
      background: transparent;
    }
    .input-wrapper input::placeholder { color: #9ca3af; }

    .toggle-pwd {
      background: none; border: none; cursor: pointer;
      padding: 4px; color: #9ca3af;
      display: flex; align-items: center;
    }
    .toggle-pwd:hover { color: #4f46e5; }
    .toggle-pwd .material-icons { font-size: 20px; }

    .field-error { font-size: 12px; color: #ef4444; }

    /* ── Error Banner ────────────────────────────────────────────────────── */
    .error-banner {
      display: flex; align-items: center; gap: 8px;
      background: #fef2f2; color: #dc2626;
      border: 1px solid #fecaca;
      padding: 12px 14px; border-radius: 10px;
      font-size: 14px;
    }
    .error-banner .material-icons { font-size: 18px; }

    /* ── Submit Button ───────────────────────────────────────────────────── */
    .submit-btn {
      height: 52px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; border: none; border-radius: 12px;
      font-size: 16px; font-weight: 600;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.35);
    }
    .submit-btn:hover:not(:disabled) {
      opacity: 0.92;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
    }
    .submit-btn:active:not(:disabled) { transform: translateY(0); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .submit-btn .material-icons { font-size: 20px; }

    /* ── Divider ─────────────────────────────────────────────────────────── */
    .divider {
      display: flex; align-items: center; gap: 12px;
      color: #9ca3af; font-size: 13px;
    }
    .divider::before, .divider::after {
      content: ''; flex: 1; height: 1px; background: #e5e7eb;
    }

    /* ── Register Link ───────────────────────────────────────────────────── */
    .register-link {
      text-align: center; font-size: 14px;
      color: #6b7280; margin: 0;
    }
    .register-link a {
      color: #4f46e5; font-weight: 600;
      text-decoration: none; margin-left: 4px;
    }
    .register-link a:hover { text-decoration: underline; }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 900px) {
      .page { grid-template-columns: 1fr; }
      .left-panel { display: none; }
      .right-panel { padding: 32px 20px; background: white; }
      .mobile-logo { display: block; }
      .form-wrapper { max-width: 100%; }
    }

    @media (max-width: 480px) {
      .form-header h2 { font-size: 24px; }
      .right-panel { padding: 24px 16px; }
    }
  `]
})
export class LoginPage {
  readonly authStore = inject(AuthStore);
  readonly showPwd = signal(false);
  readonly emailFocused = signal(false);
  readonly pwdFocused = signal(false);
  private readonly fb = inject(FormBuilder);

  readonly features = [
    { icon: 'school', title: 'Expert Mentors', desc: 'Learn from industry professionals' },
    { icon: 'event', title: 'Flexible Sessions', desc: 'Book sessions on your schedule' },
    { icon: 'group', title: 'Learning Groups', desc: 'Collaborate with peers' },
  ];

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.authStore.login(this.form.getRawValue() as any);
  }
}
