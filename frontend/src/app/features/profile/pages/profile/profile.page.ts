import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { UserProfileDto } from '../../../../shared/models';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal information</p>
        </div>
        <button class="btn-logout" (click)="logout()">
          <span class="material-icons">logout</span>
          Sign Out
        </button>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      }

      @if (profile()) {
        <div class="layout">

          <!-- ── Left Column ── -->
          <div class="left-col">

            <!-- Avatar Card (no logout here) -->
            <div class="avatar-card">
              <div class="avatar-xl">{{ initials() }}</div>
              <h2>{{ profile()!.username }}</h2>
              <p class="email">{{ profile()!.email }}</p>
              @if (profile()!.createdAt) {
                <div class="joined-badge">
                  <span class="material-icons">calendar_today</span>
                  Joined {{ profile()!.createdAt | date:'mediumDate' }}
                </div>
              }
              <div class="roles-row">
                @if (authStore.isAdmin()) {
                  <span class="role-badge admin">
                    <span class="material-icons">admin_panel_settings</span> Admin
                  </span>
                }
                @if (authStore.isMentor()) {
                  <span class="role-badge mentor">
                    <span class="material-icons">school</span> Mentor
                  </span>
                }
                @if (authStore.isLearner()) {
                  <span class="role-badge learner">
                    <span class="material-icons">person</span> Learner
                  </span>
                }
              </div>
            </div>

            <!-- ── Become a Mentor CTA (learners who aren't mentors yet) ── -->
            @if (authStore.isLearner() && !authStore.isMentor()) {
              <div class="mentor-cta">
                <div class="cta-icon">
                  <span class="material-icons">school</span>
                </div>
                <div class="cta-body">
                  <strong>Become a Mentor</strong>
                  <p>Share your skills and earn by teaching others on SkillSync.</p>
                </div>
                <a routerLink="/mentors/apply" class="cta-btn">Apply Now</a>
              </div>
            }

            <!-- ── Quick Links ── -->
            <div class="quick-links">
              <a routerLink="/sessions" class="quick-link">
                <span class="material-icons">event</span>
                <span>My Sessions</span>
                <span class="material-icons arrow">chevron_right</span>
              </a>
              <a routerLink="/notifications" class="quick-link">
                <span class="material-icons">notifications</span>
                <span>Notifications</span>
                @if (unreadCount() > 0) {
                  <span class="unread-dot">{{ unreadCount() }}</span>
                }
                <span class="material-icons arrow">chevron_right</span>
              </a>
              @if (authStore.isMentor()) {
                <a routerLink="/mentor-dashboard" class="quick-link">
                  <span class="material-icons">dashboard</span>
                  <span>Mentor Dashboard</span>
                  <span class="material-icons arrow">chevron_right</span>
                </a>
              }
              @if (authStore.isAdmin()) {
                <a routerLink="/admin" class="quick-link">
                  <span class="material-icons">admin_panel_settings</span>
                  <span>Admin Panel</span>
                  <span class="material-icons arrow">chevron_right</span>
                </a>
              }
            </div>

          </div>

          <!-- ── Right Column ── -->
          <div class="right-col">

            <!-- Edit Form -->
            <div class="edit-card">
              <h3>Edit Profile</h3>
              <form [formGroup]="form" (ngSubmit)="save()" class="form">

                <div class="input-group">
                  <label class="input-label">Username</label>
                  <div class="input-wrapper">
                    <span class="material-icons input-icon">person</span>
                    <input type="text" formControlName="username" placeholder="Your username" />
                  </div>
                </div>

                <div class="two-col">
                  <div class="input-group">
                    <label class="input-label">First Name</label>
                    <div class="input-wrapper">
                      <input type="text" formControlName="firstName" placeholder="First name" />
                    </div>
                  </div>
                  <div class="input-group">
                    <label class="input-label">Last Name</label>
                    <div class="input-wrapper">
                      <input type="text" formControlName="lastName" placeholder="Last name" />
                    </div>
                  </div>
                </div>

                <div class="input-group">
                  <label class="input-label">Bio</label>
                  <div class="input-wrapper textarea-wrapper">
                    <textarea formControlName="bio" placeholder="Tell us about yourself..." rows="4"></textarea>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn-save" [disabled]="saving()">
                    @if (saving()) {
                      <mat-spinner diameter="18" />
                      <span>Saving...</span>
                    } @else {
                      <span class="material-icons">save</span>
                      <span>Update Profile</span>
                    }
                  </button>
                </div>

              </form>
            </div>

            <!-- Sign Out Card -->
            <div class="signout-card">
              <div class="signout-info">
                <span class="material-icons signout-icon">logout</span>
                <div>
                  <strong>Sign out</strong>
                  <p>You'll be redirected to the login page.</p>
                </div>
              </div>
              <button class="btn-signout" (click)="logout()">Sign Out</button>
            </div>

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; }

    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
    }
    .page-header h1 { font-size: 28px; font-weight: 800; color: #111827; margin: 0 0 4px; }
    .page-header p { color: #6b7280; font-size: 14px; margin: 0; }

    .btn-logout {
      display: flex; align-items: center; gap: 6px;
      height: 40px; padding: 0 16px; border-radius: 10px;
      background: #fee2e2; color: #dc2626; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s;
    }
    .btn-logout:hover { background: #fecaca; }
    .btn-logout .material-icons { font-size: 17px; }

    .loading-center { display: flex; justify-content: center; padding: 80px; }

    /* Layout */
    .layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
    @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } }

    /* Left col */
    .left-col { display: flex; flex-direction: column; gap: 16px; }

    /* Avatar Card */
    .avatar-card {
      background: white; border-radius: 20px; border: 1px solid #e5e7eb;
      padding: 28px; display: flex; flex-direction: column;
      align-items: center; gap: 10px; text-align: center;
    }
    .avatar-xl {
      width: 88px; height: 88px; border-radius: 24px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; font-size: 34px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .avatar-card h2 { font-size: 17px; font-weight: 700; color: #111827; margin: 0; }
    .email { font-size: 12px; color: #6b7280; margin: 0; word-break: break-all; }
    .joined-badge {
      display: flex; align-items: center; gap: 5px;
      background: #f3f4f6; padding: 5px 10px; border-radius: 20px;
      font-size: 11px; color: #6b7280;
    }
    .joined-badge .material-icons { font-size: 13px; }

    .roles-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
    .role-badge {
      display: flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700;
    }
    .role-badge .material-icons { font-size: 13px; }
    .role-badge.admin  { background: #fef3c7; color: #d97706; }
    .role-badge.mentor { background: #e0e7ff; color: #4f46e5; }
    .role-badge.learner{ background: #dcfce7; color: #16a34a; }

    /* Mentor CTA */
    .mentor-cta {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 16px; padding: 18px;
      display: flex; flex-direction: column; gap: 10px; color: white;
    }
    .cta-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; }
    .cta-icon .material-icons { font-size: 22px; }
    .cta-body strong { display: block; font-size: 14px; font-weight: 700; margin-bottom: 3px; }
    .cta-body p { font-size: 12px; opacity: 0.85; margin: 0; line-height: 1.4; }
    .cta-btn {
      display: block; text-align: center; text-decoration: none;
      background: white; color: #4f46e5;
      height: 38px; line-height: 38px; border-radius: 10px;
      font-size: 13px; font-weight: 700; transition: opacity 0.15s;
    }
    .cta-btn:hover { opacity: 0.9; }

    /* Quick Links */
    .quick-links {
      background: white; border-radius: 16px; border: 1px solid #e5e7eb;
      overflow: hidden;
    }
    .quick-link {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 16px; text-decoration: none; color: #374151;
      font-size: 14px; font-weight: 500;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.15s;
    }
    .quick-link:last-child { border-bottom: none; }
    .quick-link:hover { background: #f9fafb; }
    .quick-link .material-icons { font-size: 20px; color: #9ca3af; }
    .quick-link .arrow { margin-left: auto; font-size: 18px; color: #d1d5db; }
    .unread-dot {
      margin-left: auto; background: #ef4444; color: white;
      font-size: 10px; font-weight: 700; min-width: 18px; height: 18px;
      border-radius: 9px; padding: 0 4px;
      display: flex; align-items: center; justify-content: center;
    }

    /* Right col */
    .right-col { display: flex; flex-direction: column; gap: 20px; }

    /* Edit Card */
    .edit-card { background: white; border-radius: 20px; border: 1px solid #e5e7eb; padding: 28px; }
    .edit-card h3 { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 22px; }
    .form { display: flex; flex-direction: column; gap: 16px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 500px) { .two-col { grid-template-columns: 1fr; } }

    .input-group { display: flex; flex-direction: column; gap: 5px; }
    .input-label { font-size: 13px; font-weight: 600; color: #374151; }
    .input-wrapper {
      display: flex; align-items: center; background: #f9fafb;
      border: 1.5px solid #e5e7eb; border-radius: 12px;
      padding: 0 14px; height: 48px; transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input-wrapper:focus-within { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); background: white; }
    .textarea-wrapper { height: auto; padding: 12px 14px; align-items: flex-start; }
    .input-icon { font-size: 18px; color: #9ca3af; margin-right: 10px; }
    .input-wrapper input, .input-wrapper textarea {
      flex: 1; border: none; outline: none; font-size: 14px;
      color: #111827; background: transparent; font-family: inherit; resize: none;
    }
    .input-wrapper input::placeholder, .input-wrapper textarea::placeholder { color: #9ca3af; }

    .form-actions { display: flex; justify-content: flex-end; }
    .btn-save {
      display: flex; align-items: center; gap: 8px;
      height: 44px; padding: 0 24px; border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; border: none; font-size: 14px; font-weight: 600;
      cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,0.3); transition: opacity 0.2s;
    }
    .btn-save:hover:not(:disabled) { opacity: 0.9; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-save .material-icons { font-size: 18px; }

    /* Sign Out Card */
    .signout-card {
      background: white; border-radius: 16px; border: 1px solid #e5e7eb;
      padding: 18px 20px; display: flex; align-items: center;
      justify-content: space-between; gap: 16px; flex-wrap: wrap;
    }
    .signout-info { display: flex; align-items: center; gap: 12px; }
    .signout-icon { font-size: 22px; color: #9ca3af; }
    .signout-info strong { display: block; font-size: 14px; color: #111827; margin-bottom: 2px; }
    .signout-info p { font-size: 12px; color: #6b7280; margin: 0; }
    .btn-signout {
      height: 38px; padding: 0 18px; border-radius: 10px;
      background: #fee2e2; color: #dc2626; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer;
      white-space: nowrap; transition: background 0.15s;
    }
    .btn-signout:hover { background: #fecaca; }

    @media (max-width: 480px) {
      .page-header { flex-direction: column; align-items: flex-start; }
      .btn-logout { width: 100%; justify-content: center; }
    }
  `]
})
export class ProfilePage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  readonly authStore = inject(AuthStore);

  readonly profile = signal<UserProfileDto | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly unreadCount = signal(0);

  readonly form = this.fb.group({
    username: [''], firstName: [''], lastName: [''], bio: ['']
  });

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.form.patchValue(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  save(): void {
    this.saving.set(true);
    this.userService.updateProfile(this.form.getRawValue() as any).subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.saving.set(false);
        this.snack.open('Profile updated successfully!', 'OK', { duration: 3000 });
      },
      error: () => this.saving.set(false)
    });
  }

  logout(): void { this.authStore.logout(); }

  initials(): string {
    const p = this.profile();
    if (!p) return '?';
    return (p.firstName?.[0] ?? p.username[0]).toUpperCase();
  }
}
