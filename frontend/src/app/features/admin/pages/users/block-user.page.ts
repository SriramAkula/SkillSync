import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { AdminUserService, UserProfile } from '../../../../core/services/admin-user.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-block-user-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  animations: [
    trigger('pageAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ],
  template: `
    <div @pageAnimation class="block-page-container">
      <!-- Header -->
      <div class="page-header">
        <button class="back-button" (click)="goBack()">
          <span class="material-icons">arrow_back</span>
          Back
        </button>
      </div>

      <!-- Main Content -->
      <div class="page-content">
        <div class="block-card">
          <!-- Card Header -->
          <div class="card-header">
            <div class="header-icon danger">
              <span class="material-icons">block</span>
            </div>
            <div class="header-text">
              <h1>Block User</h1>
              <p>Permanently block this user from accessing the platform</p>
            </div>
          </div>

          <!-- User Info Section -->
          <div class="user-section">
            <div class="section-title">User Information</div>
            <div class="user-card">
              <div class="avatar-container">
                <div class="avatar-large" [style.background]="getAvatarGradient(user.username)">
                  {{ getInitials(user.username) }}
                </div>
              </div>
              <div class="user-details">
                <div class="detail-row">
                  <span class="label">Username</span>
                  <span class="value">{{ user.username }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Email</span>
                  <span class="value">{{ user.email }}</span>
                </div>
                <div class="detail-row" *ngIf="user.name">
                  <span class="label">Full Name</span>
                  <span class="value">{{ user.name }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status</span>
                  <span class="value status-active">
                    <span class="material-icons">check_circle</span>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Warning Section -->
          <div class="warning-section">
            <div class="warning-icon">
              <span class="material-icons">warning</span>
            </div>
            <div class="warning-content">
              <h3>Important Notice</h3>
              <p>
                Once blocked, this user will:
              </p>
              <ul>
                <li>Lose immediate access to all platform features</li>
                <li>Not be able to log in to their account</li>
                <li>Be unable to access any services or content</li>
                <li>Have their active sessions terminated</li>
              </ul>
              <p class="warning-note">
                This action is permanent unless you manually unblock the user later.
              </p>
            </div>
          </div>

          <!-- Block Reason Form -->
          <div class="form-section">
            <label for="blockReason" class="form-label">Reason for Blocking *</label>
            <p class="form-description">
              Please provide a clear reason for blocking this user. This information will be recorded for audit purposes.
            </p>
            <textarea
              id="blockReason"
              [(ngModel)]="blockReason"
              placeholder="Example: Violation of terms of service, inappropriate behavior, spam activities..."
              class="form-textarea"
              rows="6"
              (keyup.escape)="goBack()"
            ></textarea>
            @if (submitted() && !blockReason.trim()) {
              <p class="form-error">
                <span class="material-icons">error</span>
                Reason is required
              </p>
            }
          </div>

          <!-- Action Buttons -->
          <div class="button-group">
            <button class="btn btn-cancel" (click)="goBack()" [disabled]="isLoading()">
              Cancel
            </button>
            <button
              class="btn btn-danger"
              (click)="confirmBlock()"
              [disabled]="!blockReason.trim() || isLoading()"
            >
              @if (isLoading()) {
                <mat-spinner diameter="20" />
                <span>Blocking...</span>
              } @else {
                <span class="material-icons">block</span>
                <span>Block User</span>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .block-page-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 20px;
      display: flex;
      flex-direction: column;
    }

    .page-header {
      max-width: 700px;
      margin: 0 auto 30px;
      width: 100%;
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #2a2a3e;
      border: 1px solid #444;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #e0e0e0;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #3a3a4e;
        border-color: #666;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .material-icons {
        font-size: 20px;
      }
    }

    .page-content {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .block-card {
      background: #252540;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      width: 100%;
      max-width: 700px;
      overflow: hidden;
    }

    /* Card Header */
    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      padding: 30px;
      background: linear-gradient(135deg, #2a2a3e 0%, #1f1f2e 100%);
      border-bottom: 2px solid #444;
    }

    .header-icon {
      flex-shrink: 0;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;

      &.danger {
        background: #4a1f1f;
        color: #ff6b6b;
      }
    }

    .header-text h1 {
      margin: 0 0 4px 0;
      font-size: 24px;
      font-weight: 600;
      color: #ffffff;
    }

    .header-text p {
      margin: 0;
      color: #b0b0b0;
      font-size: 14px;
    }

    /* Sections */
    .user-section,
    .warning-section,
    .form-section {
      padding: 30px;
      border-bottom: 1px solid #444;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }

    /* User Card */
    .user-card {
      display: flex;
      gap: 20px;
      padding: 16px;
      background: #2a2a3e;
      border-radius: 12px;
      border: 1px solid #444;
    }

    .avatar-container {
      flex-shrink: 0;
    }

    .avatar-large {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: white;
      font-size: 28px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .user-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .detail-row .label {
      color: #888;
      font-size: 13px;
      font-weight: 500;
    }

    .detail-row .value {
      color: #e0e0e0;
      font-size: 14px;
      font-weight: 500;
      word-break: break-word;
      text-align: right;
      flex: 1;
      margin-left: 16px;
    }

    .status-active {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #4caf50;
      background: #2a3a2a;
      padding: 4px 8px;
      border-radius: 4px;
      width: fit-content;

      .material-icons {
        font-size: 16px;
      }
    }

    /* Warning Section */
    .warning-section {
      display: flex;
      gap: 16px;
      background: #3a2a1a;
      border-left: 4px solid #ff9800;
    }

    .warning-icon {
      flex-shrink: 0;
      color: #ff9800;
      font-size: 24px;
    }

    .warning-content h3 {
      margin: 0 0 8px 0;
      color: #ffb74d;
      font-size: 16px;
    }

    .warning-content p {
      margin: 0 0 8px 0;
      color: #d99a54;
      font-size: 13px;
      line-height: 1.6;
    }

    .warning-content ul {
      margin: 8px 0;
      padding-left: 20px;
      color: #d99a54;
      font-size: 13px;
      line-height: 1.8;
    }

    .warning-content li {
      margin-bottom: 4px;
    }

    .warning-note {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #4a3a2a;
      color: #ffb74d;
      font-weight: 500;
      font-size: 12px;
    }

    /* Form Section */
    .form-section {
      padding: 30px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 8px;
    }

    .form-description {
      margin: 0 0 12px 0;
      color: #b0b0b0;
      font-size: 13px;
      line-height: 1.5;
    }

    .form-textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #444;
      border-radius: 8px;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.6;
      resize: vertical;
      min-height: 120px;
      background: #2a2a3e;
      color: #e0e0e0;
      transition: border-color 0.2s, box-shadow 0.2s;

      &::placeholder {
        color: #666;
      }

      &:focus {
        outline: none;
        border-color: #ff6b6b;
        box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
      }

      &:disabled {
        background: #1a1a2e;
        color: #666;
      }
    }

    .form-error {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 8px 0 0 0;
      color: #ff6b6b;
      font-size: 13px;

      .material-icons {
        font-size: 16px;
      }
    }

    /* Button Group */
    .button-group {
      display: flex;
      gap: 12px;
      padding: 30px;
      background: #2a2a3e;
      border-top: 1px solid #444;
      justify-content: flex-end;
    }

    .btn {
      padding: 12px 32px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 44px;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-cancel {
      background: #3a3a4e;
      color: #e0e0e0;
      border: 1px solid #444;

      &:hover:not(:disabled) {
        background: #4a4a5e;
        border-color: #666;
      }
    }

    .btn-danger {
      background: #d32f2f;
      color: white;
      min-width: 160px;

      &:hover:not(:disabled) {
        background: #b71c1c;
        box-shadow: 0 4px 12px rgba(211, 47, 47, 0.5);
      }

      .material-icons {
        font-size: 20px;
      }

      mat-spinner {
        display: inline-block;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .block-page-container {
        padding: 16px;
      }

      .block-card {
        border-radius: 12px;
      }

      .card-header {
        padding: 20px;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .header-text h1 {
        font-size: 20px;
      }

      .user-card {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .detail-row {
        flex-direction: column;
        gap: 4px;
      }

      .detail-row .value {
        text-align: center;
        margin-left: 0;
      }

      .user-section,
      .warning-section,
      .form-section {
        padding: 20px;
      }

      .button-group {
        flex-direction: column;
        padding: 20px;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }

      .btn-danger {
        min-width: auto;
      }
    }
  `]
})
export class BlockUserPage implements OnInit {
  user: UserProfile = {
    id: 0,
    userId: 0,
    email: '',
    username: '',
    name: '',
    bio: '',
    phoneNumber: '',
    profileImageUrl: '',
    skills: '',
    rating: 0,
    totalReviews: 0,
    isProfileComplete: false,
    createdAt: '',
    updatedAt: '',
    isBlocked: false,
    blockReason: '',
    blockDate: '',
    blockedBy: 0,
    roles: []
  };

  blockReason = '';
  isLoading = signal(false);
  submitted = signal(false);

  private adminUserService = inject(AdminUserService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUserDetails(Number(userId));
    }
  }

  loadUserDetails(userId: number): void {
    this.adminUserService.getUserDetails(userId).subscribe({
      next: (response: any) => {
        this.user = response.data;
      },
      error: (err: any) => {
        this.snackBar.open('Failed to load user details', 'Close', { duration: 3000 });
        this.router.navigate(['/admin/users']);
      }
    });
  }

  getInitials(username: string): string {
    if (!username) return '?';
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarGradient(username: string): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    ];
    const index = username.charCodeAt(0) % gradients.length;
    return gradients[index];
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }

  confirmBlock(): void {
    this.submitted.set(true);

    if (!this.blockReason.trim()) {
      return;
    }

    this.isLoading.set(true);
    this.adminUserService.blockUser(this.user.userId, this.blockReason.trim()).subscribe({
      next: () => {
        this.snackBar.open('User blocked successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/admin/users']);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to block user', 'Close', { duration: 3000 });
      }
    });
  }
}
