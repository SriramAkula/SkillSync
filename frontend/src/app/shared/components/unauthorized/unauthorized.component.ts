import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      @if (isMentorStale()) {
        <!-- Stale JWT after mentor approval -->
        <div class="icon-wrap green">
          <span class="material-icons">verified</span>
        </div>
        <h1>You're now a Mentor! 🎉</h1>
        <p>Your mentor role was approved, but your current session needs to be refreshed to unlock mentor features.</p>
        <div class="actions">
          <button class="btn-primary" (click)="relogin()">
            <span class="material-icons">refresh</span>
            Re-login to Activate
          </button>
          <a routerLink="/mentors" class="btn-secondary">Back to Mentors</a>
        </div>
        <p class="hint">This is a one-time step. After re-logging in, your Mentor Dashboard will be fully accessible.</p>
      } @else {
        <!-- Generic access denied -->
        <div class="icon-wrap red">
          <span class="material-icons">lock</span>
        </div>
        <h1>Access Denied</h1>
        <p>You don't have permission to view this page.</p>
        <div class="actions">
          <a routerLink="/mentors" class="btn-primary">
            <span class="material-icons">home</span>
            Go Home
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .container {
      min-height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 16px; padding: 24px; text-align: center;
      background: #f9fafb;
    }
    .icon-wrap {
      width: 80px; height: 80px; border-radius: 24px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 8px;
    }
    .icon-wrap.green { background: #dcfce7; }
    .icon-wrap.green .material-icons { font-size: 40px; color: #16a34a; }
    .icon-wrap.red { background: #fee2e2; }
    .icon-wrap.red .material-icons { font-size: 40px; color: #dc2626; }

    h1 { font-size: 28px; font-weight: 800; color: #111827; margin: 0; }
    p { color: #6b7280; font-size: 15px; margin: 0; max-width: 420px; line-height: 1.6; }

    .actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }

    .btn-primary {
      display: flex; align-items: center; gap: 8px;
      height: 48px; padding: 0 24px; border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; border: none; font-size: 15px; font-weight: 600;
      cursor: pointer; text-decoration: none;
      box-shadow: 0 4px 12px rgba(79,70,229,0.3); transition: opacity 0.2s;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary .material-icons { font-size: 18px; }

    .btn-secondary {
      display: flex; align-items: center; height: 48px; padding: 0 24px;
      border-radius: 12px; background: #f3f4f6; color: #374151;
      font-size: 15px; font-weight: 600; text-decoration: none;
      transition: background 0.15s;
    }
    .btn-secondary:hover { background: #e5e7eb; }

    .hint {
      font-size: 13px; color: #9ca3af;
      max-width: 380px; margin-top: 4px;
    }
  `]
})
export class UnauthorizedComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authStore = inject(AuthStore);
  readonly isMentorStale = signal(false);

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    this.isMentorStale.set(reason === 'mentor');
  }

  relogin(): void {
    // Log out and redirect to login — user re-logs in and gets fresh JWT with ROLE_MENTOR
    this.authStore.logout();
  }
}
