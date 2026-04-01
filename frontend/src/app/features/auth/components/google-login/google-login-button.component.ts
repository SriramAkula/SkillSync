import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from '../../../../core/auth/auth.store';

declare const google: any;

@Component({
  selector: 'app-google-login-button',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <button mat-stroked-button class="google-btn" (click)="login()">
      <img src="assets/google-icon.svg" alt="Google" width="20" />
      Continue with Google
    </button>
  `,
  styles: [`
    .google-btn {
      width: 100%; height: 44px; gap: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; border-color: #dadce0;
    }
  `]
})
export class GoogleLoginButtonComponent {
  private readonly authStore = inject(AuthStore);

  login(): void {
    // Google One Tap / GSI flow
    google.accounts.id.initialize({
      client_id: '537688864642-mi9j3rfvrn6e6s68kafp99lk8unchu0p.apps.googleusercontent.com',
      callback: (response: any) => this.authStore.googleLogin(response.credential)
    });
    google.accounts.id.prompt();
  }
}
