import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-register-details-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="left-panel">
        <div class="brand-content">
          <div class="brand-logo"><span class="bolt">⚡</span></div>
          <h1>SkillSync</h1>
          <p>Secure your new account</p>
          <div class="steps-preview">
            <div class="step-item done">
              <div class="step-circle"><span class="material-icons">check</span></div>
              <span>Enter Email</span>
            </div>
            <div class="step-item done">
              <div class="step-circle"><span class="material-icons">check</span></div>
              <span>Verify OTP</span>
            </div>
            <div class="step-item active">
              <div class="step-circle">3</div>
              <span>Set Password</span>
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
            <h2>Set Password</h2>
            <p>Create a secure password for <strong>{{ email }}</strong></p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="form">
            <div class="input-group">
              <label class="input-label">Password</label>
              <div class="input-wrapper" [class.focused]="pwdFocused()" [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
                <span class="material-icons input-icon">lock</span>
                <input [type]="showPwd() ? 'text' : 'password'" formControlName="password" placeholder="Min 8 characters"
                  (focus)="pwdFocused.set(true)" (blur)="pwdFocused.set(false)" />
                <button type="button" class="toggle-pwd" (click)="showPwd.set(!showPwd())">
                  <span class="material-icons">{{ showPwd() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>
            
            <div class="input-group">
              <label class="input-label">Confirm Password</label>
              <div class="input-wrapper" [class.focused]="confirmPwdFocused()" [class.error]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched">
                <span class="material-icons input-icon">lock_outline</span>
                <input [type]="showConfirmPwd() ? 'text' : 'password'" formControlName="confirmPassword" placeholder="Confirm Password"
                  (focus)="confirmPwdFocused.set(true)" (blur)="confirmPwdFocused.set(false)" />
                <button type="button" class="toggle-pwd" (click)="showConfirmPwd.set(!showConfirmPwd())">
                  <span class="material-icons">{{ showConfirmPwd() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              @if(registerForm.hasError('mismatch') && registerForm.get('confirmPassword')?.touched) {
                 <span class="error-text">Passwords must match</span>
              }
            </div>

            @if (authStore.error()) {
              <div class="error-banner">
                <span class="material-icons">error_outline</span>
                {{ authStore.error() }}
              </div>
            }

            <button type="submit" class="submit-btn" [disabled]="registerForm.invalid || authStore.loading()">
              @if (authStore.loading()) { <mat-spinner diameter="22" /> }
              @else { <span>Complete Registration</span><span class="material-icons">check_circle</span> }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
    .left-panel { position: relative; overflow: hidden; background: linear-gradient(145deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%); display: flex; align-items: center; justify-content: center; padding: 48px; }
    .brand-content { position: relative; z-index: 2; color: white; max-width: 380px; }
    .brand-logo { width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 18px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); }
    .bolt { font-size: 32px; }
    .brand-content h1 { font-size: 38px; font-weight: 800; margin: 0 0 8px; letter-spacing: -1px; }
    .brand-content p { font-size: 16px; opacity: 0.8; margin: 0 0 40px; }
    .steps-preview { display: flex; flex-direction: column; gap: 20px; }
    .step-item { display: flex; align-items: center; gap: 14px; opacity: 0.6; transition: opacity 0.3s; }
    .step-item.active { opacity: 1; }
    .step-circle { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
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
    .error-text { color: #ef4444; font-size: 12px; margin-top: 4px; }
    .error-banner { display: flex; align-items: center; gap: 8px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 10px 14px; border-radius: 10px; font-size: 14px; }
    .error-banner .material-icons { font-size: 18px; }
    .submit-btn { height: 52px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 15px rgba(79,70,229,0.35); }
    .submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    @media (max-width: 900px) { .page { grid-template-columns: 1fr; } .left-panel { display: none; } .right-panel { background: white; padding: 32px 20px; } .mobile-logo { display: block; } }
  `]
})
export class RegisterDetailsPage implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly showPwd = signal(false);
  readonly showConfirmPwd = signal(false);
  readonly pwdFocused = signal(false);
  readonly confirmPwdFocused = signal(false);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  email = '';

  readonly registerForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    return g.get('password')?.value === g.get('confirmPassword')?.value 
      ? null : { mismatch: true };
  }

  ngOnInit() {
    this.email = sessionStorage.getItem('reg_email') ?? '';
    if (!this.email) {
      this.router.navigate(['/auth/register']);
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    
    const password = this.registerForm.value.password!;
    this.authStore.register({
      email: this.email,
      password: password
    });
    
    // Check loading state to navigate to login after success
    const checkInterval: any = window.setInterval(() => {
      if (!this.authStore.loading()) {
        window.clearInterval(checkInterval);
        if (!this.authStore.error() && this.authStore.isAuthenticated()) {
          sessionStorage.removeItem('reg_email');
          this.router.navigate(['/auth/login']);
        }
      }
    }, 100);
  }
}
