import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, filter } from 'rxjs';
import { UserService } from '../../../../core/services/user.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { UserProfileDto } from '../../../../shared/models';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, DatePipe, MatProgressSpinnerModule, RouterLink],
  template: `
    <div class="page">

      <!-- ── Page Header ── -->
      <div class="page-header">
        <div class="header-text">
          <h1>My Profile</h1>
          <p>View your personal information</p>
        </div>
        <div class="header-actions">
          <button class="btn-danger" (click)="logout()">
            <span class="material-icons">logout</span>
            Sign Out
          </button>
        </div>
      </div>

      <!-- ── Loading ── -->
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48" />
          <p class="loading-text">Loading profile...</p>
        </div>
      }

      <!-- ── Profile Content (View Only — NO inputs) ── -->
      @if (!loading()) {
        <div class="layout">

          <!-- Left: Avatar Card -->
          <div class="left-col">

            <div class="avatar-card">
              <div class="avatar-circle">{{ initials() }}</div>
              <h2 class="avatar-name">{{ displayName() }}</h2>
              <p class="avatar-username">&#64;{{ displayUsername() }}</p>
              <p class="avatar-email">{{ displayEmail() }}</p>

              @if (profile()?.createdAt) {
                <div class="joined-pill">
                  <span class="material-icons">calendar_today</span>
                  Joined {{ profile()!.createdAt | date:'mediumDate' }}
                </div>
              }

              <div class="roles-row">
                @if (authStore.isAdmin()) {
                  <span class="role-pill admin">
                    <span class="material-icons">admin_panel_settings</span> Admin
                  </span>
                }
                @if (authStore.isMentor()) {
                  <span class="role-pill mentor">
                    <span class="material-icons">school</span> Mentor
                  </span>
                }
                @if (authStore.isLearner()) {
                  <span class="role-pill learner">
                    <span class="material-icons">person</span> Learner
                  </span>
                }
              </div>
            </div>


            <!-- Quick Links -->
            <nav class="quick-links">
              <a routerLink="/sessions" class="quick-link">
                <span class="material-icons">event</span>
                <span>My Sessions</span>
                <span class="material-icons ml-auto">chevron_right</span>
              </a>
              <a routerLink="/notifications" class="quick-link">
                <span class="material-icons">notifications</span>
                <span>Notifications</span>
                <span class="material-icons ml-auto">chevron_right</span>
              </a>
              @if (authStore.isMentor()) {
                <a routerLink="/mentor-dashboard" class="quick-link">
                  <span class="material-icons">dashboard</span>
                  <span>Mentor Dashboard</span>
                  <span class="material-icons ml-auto">chevron_right</span>
                </a>
              }
              @if (authStore.isAdmin()) {
                <a routerLink="/admin" class="quick-link">
                  <span class="material-icons">admin_panel_settings</span>
                  <span>Admin Panel</span>
                  <span class="material-icons ml-auto">chevron_right</span>
                </a>
              }
            </nav>

          </div>

          <!-- Right: Profile Details (READ-ONLY — zero inputs) -->
          <div class="right-col">
            <div class="details-card">

              <div class="details-header">
                <h3>Profile Details</h3>
                <button class="btn-edit-sm" (click)="goEdit()">
                  <span class="material-icons">edit</span> Edit
                </button>
              </div>

              <!-- Name -->
              <div class="detail-row">
                <div class="detail-label">
                  <span class="material-icons">person</span>
                  Full Name
                </div>
                <div class="detail-value" [class.is-placeholder]="!displayName()">
                  {{ displayName() }}
                </div>
              </div>

              <!-- Email -->
              <div class="detail-row">
                <div class="detail-label">
                  <span class="material-icons">email</span>
                  Email
                </div>
                <div class="detail-value" [class.is-placeholder]="!displayEmail()">
                  {{ displayEmail() || 'Email' }}
                </div>
              </div>

              <!-- Username -->
              <div class="detail-row">
                <div class="detail-label">
                  <span class="material-icons">alternate_email</span>
                  Username
                </div>
                <div class="detail-value" [class.is-placeholder]="!displayUsername()">
                  {{ displayUsername() || 'Username' }}
                </div>
              </div>

              <!-- Phone -->
              <div class="detail-row">
                <div class="detail-label">
                  <span class="material-icons">phone</span>
                  Phone
                </div>
                <div class="detail-value" [class.is-placeholder]="!profile()?.phoneNumber?.trim()">
                  {{ profile()?.phoneNumber?.trim() || 'Add phone number' }}
                </div>
              </div>

              <!-- Bio -->
              <div class="detail-row bio-row">
                <div class="detail-label">
                  <span class="material-icons">info_outline</span>
                  Bio
                </div>
                <div class="detail-value bio-value" [class.is-placeholder]="!profile()?.bio?.trim()">
                  {{ profile()?.bio?.trim() || 'Add bio' }}
                </div>
              </div>

              <!-- Skills -->
              <div class="detail-row skills-row">
                <div class="detail-label">
                  <span class="material-icons">auto_stories</span>
                  Skills
                </div>
                <div class="detail-value">
                  @if (skillList().length > 0) {
                    <div class="skill-chips">
                      @for (skill of skillList(); track skill) {
                        <span class="skill-chip">{{ skill }}</span>
                      }
                    </div>
                  } @else {
                    <span class="is-placeholder">Select Skills</span>
                  }
                </div>
              </div>

            </div>
          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    /* ── Page ── */
    .page { max-width: 980px; margin: 0 auto; padding-bottom: 40px; }

    /* ── Header ── */
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 32px; flex-wrap: wrap; gap: 16px;
    }
    .header-text h1 {
      font-size: 28px; font-weight: 800; color: var(--text); margin: 0 0 4px;
      letter-spacing: -0.5px;
    }
    .header-text p { font-size: 14px; color: var(--text-secondary); margin: 0; }
    .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 7px;
      height: 42px; padding: 0 20px; border-radius: 10px;
      background: #4f46e5; color: #fff; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: background .15s, transform .1s;
    }
    .btn-primary:hover { background: #4338ca; transform: translateY(-1px); }
    .btn-primary .material-icons { font-size: 18px; }

    .btn-danger {
      display: inline-flex; align-items: center; gap: 7px;
      height: 42px; padding: 0 18px; border-radius: 10px;
      background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: background .15s;
    }
    .btn-danger:hover { background: #fee2e2; }
    .btn-danger .material-icons { font-size: 18px; }

    /* ── Loading ── */
    .loading-center {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 80px; gap: 16px;
    }
    .loading-text { font-size: 14px; color: #6b7280; margin: 0; }

    /* ── Layout ── */
    .layout { display: grid; grid-template-columns: 290px 1fr; gap: 24px; align-items: start; }
    @media (max-width: 780px) { .layout { grid-template-columns: 1fr; } }

    /* ── Left Column ── */
    .left-col { display: flex; flex-direction: column; gap: 16px; }

    /* Avatar Card */
    .avatar-card {
      background: var(--surface); border-radius: 20px; border: 1px solid var(--border);
      padding: 32px 24px; display: flex; flex-direction: column;
      align-items: center; gap: 8px; text-align: center;
      box-shadow: var(--shadow-sm);
    }
    .avatar-circle {
      width: 90px; height: 90px; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: #fff; font-size: 36px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px; box-shadow: var(--shadow-primary);
    }
    .avatar-name { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
    .avatar-username { font-size: 13px; color: var(--primary); font-weight: 600; margin: 0; }
    .avatar-email { font-size: 12px; color: var(--text-secondary); margin: 0; word-break: break-all; }

    .joined-pill {
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--surface-alt); padding: 5px 12px; border-radius: 20px;
      font-size: 11px; color: var(--text-secondary); margin-top: 4px;
    }
    .joined-pill .material-icons { font-size: 13px; }

    .roles-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 4px; }
    .role-pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;
    }
    .role-pill .material-icons { font-size: 13px; }
    .role-pill.admin   { background: #fef3c7; color: #d97706; }
    .role-pill.mentor  { background: #e0e7ff; color: #4f46e5; }
    .role-pill.learner { background: #dcfce7; color: #16a34a; }

    /* CTA Card */
    .cta-card {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 16px; padding: 20px;
      display: flex; flex-direction: column; gap: 10px; color: #fff;
      box-shadow: 0 4px 14px rgba(79,70,229,.3);
    }
    .cta-icon { font-size: 28px; }
    .cta-card strong { font-size: 14px; font-weight: 700; }
    .cta-card p { font-size: 12px; opacity: .85; margin: 0; line-height: 1.5; }
    .cta-btn {
      display: block; text-align: center; text-decoration: none;
      background: #fff; color: #4f46e5;
      height: 38px; line-height: 38px; border-radius: 10px;
      font-size: 13px; font-weight: 700; transition: opacity .15s;
    }
    .cta-btn:hover { opacity: .9; }

    /* Quick Links */
    .quick-links {
      background: var(--surface); border-radius: 16px; border: 1px solid var(--border);
      overflow: hidden; box-shadow: var(--shadow-sm);
    }
    .quick-link {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; text-decoration: none; color: var(--text);
      font-size: 14px; font-weight: 500;
      border-bottom: 1px solid var(--border); transition: background .15s;
    }
    .quick-link:last-child { border-bottom: none; }
    .quick-link:hover { background: var(--surface-alt); }
    .quick-link .material-icons { font-size: 20px; color: var(--text-muted); }
    .ml-auto { margin-left: auto; color: var(--border-strong) !important; font-size: 18px !important; }

    /* ── Right Column ── */
    .right-col { display: flex; flex-direction: column; gap: 20px; }

    .details-card {
      background: var(--surface); border-radius: 20px; border: 1px solid var(--border);
      padding: 28px; box-shadow: var(--shadow-sm);
    }
    .details-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
    }
    .details-header h3 { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }

    .btn-edit-sm {
      display: inline-flex; align-items: center; gap: 5px;
      height: 34px; padding: 0 14px; border-radius: 8px;
      background: #ede9fe; color: #4f46e5; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s;
    }
    .btn-edit-sm:hover { background: #ddd6fe; }
    .btn-edit-sm .material-icons { font-size: 16px; }

    /* Detail Rows — READ ONLY, no inputs ever */
    .detail-row {
      display: flex; align-items: flex-start; gap: 16px;
      padding: 14px 0; border-bottom: 1px solid var(--border);
    }
    .detail-row:last-child { border-bottom: none; padding-bottom: 0; }

    .detail-label {
      display: flex; align-items: center; gap: 7px;
      min-width: 140px; font-size: 13px; font-weight: 600; color: var(--text-secondary);
      flex-shrink: 0; padding-top: 1px;
    }
    .detail-label .material-icons { font-size: 17px; color: var(--text-muted); }

    .detail-value {
      font-size: 14px; color: var(--text); flex: 1;
      line-height: 1.6; word-break: break-word;
    }
    .detail-value.is-placeholder { color: var(--text-muted); font-style: italic; }

    .bio-row { align-items: flex-start; }
    .bio-value { white-space: pre-wrap; }

    .skills-row { align-items: flex-start; }
    .skill-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-chip {
      background: var(--primary-light); color: var(--primary);
      padding: 5px 14px; border-radius: 20px;
      font-size: 12px; font-weight: 600; letter-spacing: .2px;
    }

    /* ── Responsive ── */
    @media (max-width: 500px) {
      .page-header { flex-direction: column; }
      .header-actions { width: 100%; }
      .btn-primary, .btn-danger { flex: 1; justify-content: center; }
      .detail-row { flex-direction: column; gap: 4px; }
      .detail-label { min-width: unset; }
    }
  `]
})
export class ProfilePage implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly router      = inject(Router);
  readonly authStore            = inject(AuthStore);

  readonly profile = signal<UserProfileDto | null>(null);
  readonly loading = signal(true);

  private navSub!: Subscription;

  ngOnInit(): void {
    // Re-fetch every time the user enters the profile page
    // This handles initial load, forward navigation, and back navigation from Edit Profile
    this.navSub = this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        // Trigger on /profile or /profile with query params
        filter(e => e.urlAfterRedirects.split('?')[0] === '/profile')
      )
      .subscribe(() => this.fetchProfile());

    // Trigger initial fetch if we're already on the profile page upon component creation
    if (this.router.url.split('?')[0] === '/profile') {
      this.fetchProfile();
    }
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  /** Always hits the API — no local cache, no stale state */
  private fetchProfile(): void {
    this.loading.set(true);
    this.profile.set(null);
    this.userService.getMyProfile().subscribe({
      next:  res => { this.profile.set(res.data); this.loading.set(false); },
      error: (e) => {
        // 404 on fresh DB — set a minimal profile from authStore so the page renders
        if (e?.status === 404 || e?.status === 0) {
          this.profile.set({
            userId:   0,
            email:    this.authStore.email()    || '',
            username: this.authStore.username() || '',
            name:     null,
            bio:      null,
            phoneNumber: null,
            skills:   null,
            createdAt: null
          } as any);
        }
        this.loading.set(false);
      }
    });
  }

  // ── Display helpers — never return blank ──────────────────────────────────

  displayName(): string {
    const backendName = this.profile()?.name?.trim();
    if (backendName) return backendName;

    const oauthName = localStorage.getItem('oauth_name');
    if (oauthName) return oauthName;

    return this.authStore.username() || 'User';
  }

  displayUsername(): string {
    return this.profile()?.username || this.authStore.username() || 'user';
  }

  displayEmail(): string {
    return this.profile()?.email?.trim() || this.authStore.email() || 'Email';
  }

  initials(): string {
    const src = this.displayName();
    return src ? src[0].toUpperCase() : '?';
  }

  skillList(): string[] {
    const raw = this.profile()?.skills;
    return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
  }

  goEdit(): void  { this.router.navigate(['/profile/edit']); }
  logout(): void  { this.authStore.logout(); }
}
