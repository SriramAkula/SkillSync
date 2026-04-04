import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  api = inject(ApiService);
  router = inject(Router);
  toast = inject(ToastService);
  auth = inject(AuthService);

  step: 'email' | 'otp' | 'details' = 'email';
  
  email = '';
  otp = '';
  username = '';
  password = '';
  confirmPassword = '';
  loading = false;

  sendOtp() {
    if (!this.email) return;
    this.loading = true;
    this.api.post('/auth/send-otp', { email: this.email }).subscribe({
      next: () => {
        this.toast.success('OTP sent to your email');
        this.step = 'otp';
        this.auth.setTempEmail(this.email);
        this.loading = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to send OTP');
        this.loading = false;
      }
    });
  }

  verifyOtp() {
    if (!this.otp) return;
    this.loading = true;
    this.api.post('/auth/verify-otp', { email: this.email, otp: this.otp }).subscribe({
      next: () => {
        this.toast.success('Email verified!');
        this.step = 'details';
        this.loading = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Invalid OTP');
        this.loading = false;
      }
    });
  }

  register() {
    if (this.password !== this.confirmPassword) {
      this.toast.error('Passwords do not match');
      return;
    }
    this.loading = true;
    this.api.post<{token: string}>('/auth/register', {
      email: this.email,
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.auth.setToken(res.token);
        this.toast.success('Registration successful. Welcome!');
        this.router.navigate(['/']);
        this.loading = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Registration failed');
        this.loading = false;
      }
    });
  }
}
