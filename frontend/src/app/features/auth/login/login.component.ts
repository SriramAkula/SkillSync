import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  api = inject(ApiService);
  auth = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  toast = inject(ToastService);

  email = '';
  password = '';
  loading = false;

  login() {
    if (!this.email || !this.password) {
      this.toast.error('Email and password are required');
      return;
    }
    this.loading = true;
    this.api.post<{ token: string, type: string, roles: string[] }>('/auth/login', {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.auth.setToken(res.token);
        this.toast.success('Logged in successfully');
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigate([returnUrl]);
        this.loading = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Login failed');
        this.loading = false;
      }
    });
  }
}
