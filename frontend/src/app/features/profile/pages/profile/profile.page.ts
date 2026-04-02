import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
    <div class="page-container">
      <!-- Header Area -->
      <div class="header-section">
        <div class="header-content">
          <h1>My Profile</h1>
          <p>Manage your account settings and profile information</p>
        </div>
        <button class="logout-btn" (click)="logout()">
          <span class="material-icons">logout</span>
          <span>Sign Out</span>
        </button>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loader-box">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      }

      <!-- Profile Content -->
      @if (profile()) {
        <div class="profile-layout">
          
          <!-- Sidebar -->
          <div class="profile-sidebar">
            <div class="user-card">
              <div class="user-avatar">{{ initials() }}</div>
              <h2 class="user-name">{{ fullName() }}</h2>
              <p class="user-email">{{ profile()!.email }}</p>
              <div class="user-handle">&#64;{{ profile()!.username }}</div>
              
              <div class="badge-row">
                <span class="role-pill learner">
                  <span class="pulse"></span> Learner
                </span>
              </div>

              @if (profile()!.createdAt) {
                <div class="joined-date">
                  <span class="material-icons">event</span>
                  Member since {{ profile()!.createdAt | date:'mediumDate' }}
                </div>
              }
            </div>

            <nav class="profile-nav">
              <a routerLink="/sessions" class="nav-button">
                <span class="material-icons">calendar_today</span>
                <span>My Sessions</span>
                <span class="material-icons chevron">chevron_right</span>
              </a>
              <a routerLink="/notifications" class="nav-button">
                <span class="material-icons">notifications</span>
                <span>Notifications</span>
                <span class="material-icons chevron">chevron_right</span>
              </a>
            </nav>
          </div>

          <!-- Main Content Area -->
          <div class="profile-main">
            <div class="content-card">
              <div class="card-top">
                <h3>{{ isEditing() ? 'Edit Profile' : 'Account Details' }}</h3>
                @if (!isEditing()) {
                  <button class="edit-toggle" (click)="isEditing.set(true)">
                    <span class="material-icons">edit</span> Edit
                  </button>
                }
              </div>

              @if (!isEditing()) {
                <!-- View Mode -->
                <div class="info-list">
                  <div class="info-item">
                    <div class="info-icon"><span class="material-icons">person</span></div>
                    <div class="info-label">Full Name</div>
                    <div class="info-value">{{ fullName() }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-icon"><span class="material-icons">alternate_email</span></div>
                    <div class="info-label">Username</div>
                    <div class="info-value">&#64;{{ profile()!.username }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-icon"><span class="material-icons">email</span></div>
                    <div class="info-label">Email Address</div>
                    <div class="info-value">{{ profile()!.email }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-icon"><span class="material-icons">phone</span></div>
                    <div class="info-label">Phone Number</div>
                    <div class="info-value">{{ profile()!.phoneNumber || 'Not provided' }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-icon"><span class="material-icons">description</span></div>
                    <div class="info-label">Bio</div>
                    <div class="info-value bio-text">{{ profile()!.bio || 'Tell us about yourself...' }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-icon"><span class="material-icons">workspace_premium</span></div>
                    <div class="info-label">Skills</div>
                    <div class="info-value">Select Skills</div>
                  </div>
                </div>
              } @else {
                <!-- Edit Mode -->
                <form [formGroup]="form" (ngSubmit)="save()" class="profile-form">
                  <div class="form-grid">
                    <div class="form-field">
                      <label>Username</label>
                      <div class="input-container">
                        <span class="material-icons">person</span>
                        <input type="text" formControlName="username" />
                      </div>
                    </div>
                    
                    <div class="form-row">
                      <div class="form-field">
                        <label>First Name</label>
                        <div class="input-container">
                          <input type="text" formControlName="firstName" />
                        </div>
                      </div>
                      <div class="form-field">
                        <label>Last Name</label>
                        <div class="input-container">
                          <input type="text" formControlName="lastName" />
                        </div>
                      </div>
                    </div>

                    <div class="form-field">
                      <label>Bio</label>
                      <div class="input-container textarea-container">
                        <textarea formControlName="bio" rows="4"></textarea>
                      </div>
                    </div>

                    <div class="form-field">
                      <label>Phone Number</label>
                      <div class="input-container">
                        <span class="material-icons">phone</span>
                        <input type="text" formControlName="phoneNumber" />
                      </div>
                    </div>
                  </div>

                  <div class="form-footer">
                    <button type="button" class="cancel-btn" (click)="isEditing.set(false)">Cancel</button>
                    <button type="submit" class="save-btn" [disabled]="saving() || form.invalid">
                      @if (saving()) {
                        <mat-spinner diameter="20"></mat-spinner>
                      } @else {
                        <span>Save Changes</span>
                      }
                    </button>
                  </div>
                  @if (form.get('phoneNumber')?.invalid && form.get('phoneNumber')?.touched) {
                    <p class="error-msg">Phone number must be exactly 10 digits.</p>
                  }
                </form>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; background-color: #f8fafc; min-height: 100vh; }
    
    .page-container { max-width: 1100px; margin: 0 auto; padding: 40px 20px; }

    /* Header Section */
    .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .header-content h1 { font-size: 32px; font-weight: 800; color: #0f172a; margin: 0 0 8px; letter-spacing: -0.025em; }
    .header-content p { color: #64748b; font-size: 15px; margin: 0; }

    .logout-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 12px;
      background: #fee2e2; color: #ef4444; border: none;
      font-size: 14px; font-weight: 700; cursor: pointer;
      transition: all 0.2s ease;
    }
    .logout-btn:hover { background: #fecaca; transform: translateY(-1px); }
    .logout-btn .material-icons { font-size: 20px; }

    .loader-box { display: flex; justify-content: center; padding: 100px; }

    /* Layout Grid */
    .profile-layout { display: grid; grid-template-columns: 320px 1fr; gap: 32px; align-items: start; }
    @media (max-width: 900px) { .profile-layout { grid-template-columns: 1fr; } }

    /* Sidebar Components */
    .profile-sidebar { display: flex; flex-direction: column; gap: 24px; }
    
    .user-card {
      background: white; border-radius: 24px; padding: 40px 24px;
      display: flex; flex-direction: column; align-items: center;
      text-align: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }
    .user-avatar {
      width: 100px; height: 100px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; font-size: 38px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px; box-shadow: 0 10px 20px -5px rgba(99,102,241,0.4);
    }
    .user-name { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
    .user-email { font-size: 14px; color: #6366f1; font-weight: 600; margin: 0 0 2px; }
    .user-handle { font-size: 13px; color: #94a3b8; margin: 0 0 20px; }

    .badge-row { margin-bottom: 20px; }
    .role-pill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 14px; border-radius: 20px;
      font-size: 11px; font-weight: 700;
    }
    .role-pill.learner { background: #dcfce7; color: #15803d; }
    .pulse { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; position: relative; }
    .pulse::after {
      content: ''; position: absolute; width: 100%; height: 100%;
      background: inherit; border-radius: 50%; animation: pulse 2s infinite;
    }
    @keyframes pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }

    .joined-date {
      display: flex; align-items: center; gap: 6px;
      color: #94a3b8; font-size: 12px; font-weight: 500;
    }
    .joined-date .material-icons { font-size: 15px; }

    /* Profile Nav */
    .profile-nav {
      background: white; border-radius: 20px; overflow: hidden;
      border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
    }
    .nav-button {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 20px; text-decoration: none; color: #475569;
      font-size: 14px; font-weight: 600; transition: all 0.2s;
      border-bottom: 1px solid #f1f5f9;
    }
    .nav-button:last-child { border-bottom: none; }
    .nav-button:hover { background: #f8fafc; color: #6366f1; }
    .nav-button .material-icons:not(.chevron) { font-size: 20px; color: #94a3b8; }
    .nav-button .chevron { margin-left: auto; font-size: 18px; color: #cbd5e1; }
    .nav-button:hover .material-icons { color: #6366f1; }

    /* Main Content Area */
    .profile-main { }
    .content-card {
      background: white; border-radius: 24px; padding: 40px;
      border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
      min-height: 500px;
    }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    .card-top h3 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }

    .edit-toggle {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 10px;
      background: #f1f5f9; color: #475569; border: none;
      font-size: 13px; font-weight: 700; cursor: pointer;
      transition: all 0.2s;
    }
    .edit-toggle:hover { background: #e2e8f0; }

    /* Info List */
    .info-list { display: flex; flex-direction: column; }
    .info-item {
      display: grid; grid-template-columns: 44px 160px 1fr;
      align-items: center; padding: 22px 0; border-bottom: 1px solid #f1f5f9;
    }
    .info-item:last-child { border-bottom: none; }
    .info-icon { color: #94a3b8; display: flex; align-items: center; }
    .info-icon .material-icons { font-size: 20px; }
    .info-label { font-size: 14px; font-weight: 600; color: #64748b; }
    .info-value { font-size: 14px; font-weight: 600; color: #1e293b; }
    .bio-text { line-height: 1.6; color: #475569; font-weight: 500; }

    /* Form Styles */
    .profile-form { display: flex; flex-direction: column; gap: 24px; }
    .form-grid { display: flex; flex-direction: column; gap: 20px; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field label { font-size: 13px; font-weight: 700; color: #475569; }
    
    .input-container {
      display: flex; align-items: center; gap: 10px;
      background: #f8fafc; border: 2px solid #e2e8f0;
      border-radius: 12px; padding: 0 14px; height: 50px;
    }
    .input-container:focus-within { border-color: #6366f1; background: white; }
    .input-container input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 14px; font-weight: 600; color: #1e293b;
    }
    .textarea-container { height: auto; padding: 12px 14px; }
    .textarea-container textarea {
      width: 100%; border: none; outline: none; background: transparent;
      font-size: 14px; font-weight: 500; color: #1e293b; font-family: inherit;
      resize: none;
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .form-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
    .cancel-btn {
      height: 48px; padding: 0 24px; border-radius: 12px;
      background: white; border: 2px solid #e2e8f0;
      color: #64748b; font-size: 14px; font-weight: 700; cursor: pointer;
    }
    .save-btn {
      display: flex; align-items: center; justify-content: center;
      height: 48px; padding: 0 32px; border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white; border: none; font-size: 14px; font-weight: 700;
      cursor: pointer; box-shadow: 0 8px 16px rgba(99,102,241,0.25);
    }
    .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .error-msg { color: #ef4444; font-size: 12px; font-weight: 600; text-align: right; margin: -10px 0 0; }
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
  readonly isEditing = signal(false);

  readonly form = this.fb.group({
    username:    ['', [Validators.required, Validators.minLength(2)]],
    firstName:   ['', [Validators.required]],
    lastName:    [''],
    bio:         ['', [Validators.maxLength(500)]],
    phoneNumber: ['', [Validators.pattern('^[0-9]{10}$')]],
    skills:      [[] as string[]]
  });

  ngOnInit(): void {
    this.refreshProfile();
  }

  refreshProfile(): void {
    this.loading.set(true);
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        const p = res.data;
        this.profile.set(p);

        // Name Handing: Split backend 'name' into firstName/lastName
        let first = '', last = '';
        if (p.name) {
          const parts = p.name.trim().split(' ');
          first = parts[0];
          last = parts.slice(1).join(' ');
        }

        const emailPrefix = p.email.split('@')[0];
        
        this.form.patchValue({
          username: p.username || emailPrefix,
          firstName: first,
          lastName: last,
          bio: p.bio || '',
          phoneNumber: p.phoneNumber || ''
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const val = this.form.getRawValue();
    
    // Concatenate name for backend UpdateProfileRequest
    const combinedName = `${val.firstName ?? ''} ${val.lastName ?? ''}`.trim();

    this.userService.updateProfile({
      username: val.username || undefined,
      name: combinedName || undefined,
      bio: val.bio || undefined,
      phoneNumber: val.phoneNumber || undefined
    }).subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.saving.set(false);
        this.isEditing.set(false);
        this.snack.open('Profile updated successfully!', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        console.error('Update Failed:', err);
        this.snack.open('Failed to update profile. Please check your inputs.', 'Retry', { duration: 5000 });
      }
    });
  }

  logout(): void { this.authStore.logout(); }

  initials(): string {
    const p = this.profile();
    if (!p) return '?';
    // Use part of name if available
    const name = p.name || p.username || '';
    return name.charAt(0).toUpperCase();
  }

  fullName(): string {
    const p = this.profile();
    if (!p) return '';
    return p.name || p.username;
  }
}
