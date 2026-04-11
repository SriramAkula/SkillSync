import { Component, inject, OnInit } from '@angular/core';

import { AuthStore } from '../../../../core/auth/auth.store';

declare const google: {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      renderButton: (element: HTMLElement | null, options: { theme: string; size: string; width: string }) => void;
    };
  };
};

@Component({
  selector: 'app-google-login-button',
  standalone: true,
  templateUrl: './google-login-button.component.html',
  styleUrl: './google-login-button.component.scss'
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
      callback: (response) => this.authStore.googleLogin(response.credential)
    });
    // This renders the actual Google Sign-In button
    google.accounts.id.renderButton(
      document.getElementById('google-btn-container'),
      { theme: 'outline', size: 'large', width: '100%' }
    );
  }
}

