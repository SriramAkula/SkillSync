import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from '../../../../core/auth/auth.store';

declare const google: any;

@Component({
  selector: 'app-google-login-button',
  standalone: true,
  template: `<div id="google-btn-container"></div>`,
  styles: [`
    #google-btn-container {
      display: flex; justify-content: center; width: 100%;
    }
  `]
})
export class GoogleLoginButtonComponent implements OnInit {
  private readonly authStore = inject(AuthStore);

  ngOnInit(): void {
    if (typeof google === 'undefined') {
      console.warn('Google Identity Services script not loaded');
      return;
    }
    google.accounts.id.initialize({
      client_id: '537688864642-mi9j3rfvrn6e6s68kafp99lk8unchu0p.apps.googleusercontent.com',
      callback: (response: any) => this.authStore.googleLogin(response.credential)
    });
    // This renders the actual Google Sign-In button
    google.accounts.id.renderButton(
      document.getElementById('google-btn-container'),
      { theme: 'outline', size: 'large', width: '100%' }
    );
  }
}

