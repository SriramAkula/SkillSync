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
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss'
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
    const { email, password } = this.form.getRawValue();
    if (email && password) {
      this.authStore.login({ email, password });
    }
  }
}
