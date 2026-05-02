import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../../core/store/auth.store';

@Component({
  selector: 'app-register-details-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule],
  templateUrl: './register-details.page.html',
  styleUrl: './register-details.page.scss'
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

  ngOnInit(): void {
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
    const checkInterval: number = window.setInterval(() => {
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
