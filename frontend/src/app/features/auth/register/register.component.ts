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
    this.auth.sendOtp(this.email).subscribe({
      next: () => {
        this.toast.success('OTP sent to your email');
        this.step = 'otp';
        this.auth.setTempEmail(this.email);
        this.loading = false;
      },
      error: (err) => {
        console.error('OTP Send Error Details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          errorBody: err.error
        });
        
        // Handle potential Parser Error for 200 OK (CORS body blocking issue)
        if (err.status === 200 || err.status === 0) {
          this.toast.success('OTP sent successfully (Body obscured by CORS)');
          this.step = 'otp';
          this.auth.setTempEmail(this.email);
        } else {
          this.toast.error(err.error?.message || 'Failed to send OTP. Please check your connection.');
        }
        this.loading = false;
      }
    });
  }

  verifyOtp() {
    if (!this.otp) return;
    this.loading = true;
    this.auth.verifyOtp(this.email, this.otp).subscribe({
      next: () => {
        this.toast.success('Email verified!');
        this.step = 'details';
        this.loading = false;
      },
      error: (err) => {
        console.error('OTP Verify Error Details:', err);
        if (err.status === 200) {
          this.toast.success('Email verified! (Body obscured by CORS)');
          this.step = 'details';
        } else {
          this.toast.error(err.error?.message || 'Invalid or expired OTP');
        }
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
    this.auth.register({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        if (res && res.token) {
          this.auth.setToken(res.token);
          this.toast.success('Registration successful. Welcome!');
          this.router.navigate(['/']);
        }
        this.loading = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Registration failed');
        this.loading = false;
      }
    });
  }
}
