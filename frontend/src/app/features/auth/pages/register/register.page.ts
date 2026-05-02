import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../../core/store/auth.store';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss'
})
export class RegisterPage {
  readonly authStore = inject(AuthStore);
  readonly emailFocused = signal(false);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  constructor() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.registerForm.patchValue({ email: params['email'] });
      }
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    
    const email = this.registerForm.value.email!;
    this.authStore.sendOtp(email);
    
    // Check loading state to prevent immediate route
    const checkInterval: number = window.setInterval(() => {
      if (!this.authStore.loading()) {
        window.clearInterval(checkInterval);
        if (!this.authStore.error() && this.authStore.otpSent()) {
          sessionStorage.setItem('reg_email', email);
          this.router.navigate(['/auth/verify-otp']);
        }
      }
    }, 100);
  }
}
