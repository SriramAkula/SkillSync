import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminUserService, UserProfile } from '../../../../core/services/admin-user.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="detail-page">
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="50" strokeWidth="4"></mat-spinner>
        </div>
      } @else if (user) {
        <!-- Header Section -->
        <div class="page-header">
          <div class="header-content">
            <button class="back-btn" (click)="goBack()" title="Go back">
              <span class="material-icons">arrow_back</span>
              Back
            </button>
            <div class="header-title">
              <h1>{{ user.username }}</h1>
              <p class="header-subtitle">User Profile Details</p>
            </div>
          </div>
          <div class="header-actions">
            @if (user.isBlocked) {
              <button class="btn btn-success" (click)="unblockUser()">
                <span class="material-icons">check_circle</span>
                Unblock User
              </button>
            } @else {
              <button class="btn btn-danger" (click)="blockUser()">
                <span class="material-icons">block</span>
                Block User
              </button>
            }
          </div>
        </div>

        <!-- Profile Section -->
        <div class="profile-section">
          <div class="profile-card" [class.blocked]="user.isBlocked">
            <div class="profile-header">
              <div class="avatar-large">{{ getInitials(user.username) }}</div>
              <div class="profile-info">
                <h2>{{ user.username }}</h2>
                <span class="status-badge" [class.blocked]="user.isBlocked">
                  {{ user.isBlocked ? '🔒 Blocked' : '✓ Active' }}
                </span>
              </div>
            </div>

            <!-- Info Grid -->
            <div class="info-grid">
              <!-- Email -->
              <div class="info-block">
                <span class="info-icon">📧</span>
                <div class="info-content">
                  <span class="info-label">Email</span>
                  <span class="info-value">{{ user.email }}</span>
                  <button class="copy-btn" (click)="copyToClipboard(user.email)" title="Copy email">
                    <span class="material-icons">content_copy</span>
                  </button>
                </div>
              </div>

              <!-- Full Name -->
              <div class="info-block">
                <span class="info-icon">👤</span>
                <div class="info-content">
                  <span class="info-label">Full Name</span>
                  <span class="info-value">{{ user.name || '—' }}</span>
                </div>
              </div>

              <!-- Roles -->
              <div class="info-block">
                <span class="info-icon">🔐</span>
                <div class="info-content">
                  <span class="info-label">Roles</span>
                  <span class="info-value">
                    @if (user.roles && user.roles.length > 0) {
                      <span class="roles-list">
                        @for (role of user.roles; track role) {
                          <span class="role-badge">{{ role }}</span>
                        }
                      </span>
                    } @else {
                      —
                    }
                  </span>
                </div>
              </div>

              <!-- Joined Date -->
              <div class="info-block">
                <span class="info-icon">📅</span>
                <div class="info-content">
                  <span class="info-label">Joined</span>
                  <span class="info-value">{{ user.createdAt | date:'MMM d, y @ h:mm a' }}</span>
                </div>
              </div>

              <!-- Profile Status -->
              <div class="info-block">
                <span class="info-icon">📋</span>
                <div class="info-content">
                  <span class="info-label">Profile Status</span>
                  <span class="info-value">{{ user.isProfileComplete ? '✓ Complete' : 'Incomplete' }}</span>
                </div>
              </div>

              <!-- Rating -->
              <div class="info-block">
                <span class="info-icon">⭐</span>
                <div class="info-content">
                  <span class="info-label">Rating</span>
                  <span class="info-value">{{ user.rating != null ? user.rating.toFixed(1) : 'N/A' }}</span>
                </div>
              </div>

              <!-- Total Reviews -->
              <div class="info-block">
                <span class="info-icon">💬</span>
                <div class="info-content">
                  <span class="info-label">Total Reviews</span>
                  <span class="info-value">{{ user.totalReviews }}</span>
                </div>
              </div>
            </div>

            <!-- Block Info Section -->
            @if (user.isBlocked) {
              <div class="divider"></div>
              <div class="block-info">
                <div class="block-header">
                  <span class="material-icons warning">block</span>
                  <h3>Block Information</h3>
                </div>
                <div class="block-details">
                  <div class="block-detail-item">
                    <span class="label">Reason:</span>
                    <span class="value reason">{{ user.blockReason }}</span>
                  </div>
                  <div class="block-detail-item">
                    <span class="label">Blocked On:</span>
                    <span class="value">{{ user.blockDate | date:'MMM d, y @ h:mm a' }}</span>
                  </div>
                  <div class="block-detail-item">
                    <span class="label">Blocked By:</span>
                    <span class="value">Admin ID: {{ user.blockedBy }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <span class="material-icons">person_off</span>
          <h3>User Not Found</h3>
          <p>The user you're looking for doesn't exist or has been deleted.</p>
          <button class="btn btn-primary" (click)="goBack()">
            <span class="material-icons">arrow_back</span>
            Go Back
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 2rem;
    }

    /* Loading State */
    .loading-center {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      gap: 2rem;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex: 1;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      color: #333;
      transition: all 0.2s;
      font-size: 0.95rem;
    }

    .back-btn:hover {
      background: #f5f5f5;
      border-color: #4a90e2;
      color: #4a90e2;
    }

    .back-btn .material-icons {
      font-size: 20px;
    }

    .header-title h1 {
      margin: 0;
      font-size: 2rem;
      color: #1a1a1a;
      font-weight: 700;
    }

    .header-subtitle {
      margin: 0.5rem 0 0 0;
      color: #666;
      font-size: 0.95rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    /* Buttons */
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.875rem 1.75rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .btn .material-icons {
      font-size: 18px;
    }

    .btn-danger {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
      color: white;
    }

    .btn-danger:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3);
    }

    .btn-success {
      background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
      color: white;
    }

    .btn-success:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(81, 207, 102, 0.3);
    }

    .btn-primary {
      background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(74, 144, 226, 0.3);
    }

    /* Profile Section */
    .profile-section {
      display: flex;
      justify-content: center;
    }

    .profile-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      padding: 0;
      max-width: 700px;
      width: 100%;
      overflow: hidden;
      transition: all 0.3s;
    }

    .profile-card.blocked {
      border-left: 6px solid #ff6b6b;
    }

    .profile-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem 2rem;
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .profile-card.blocked .profile-header {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    }

    .avatar-large {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      font-weight: 700;
      flex-shrink: 0;
      border: 3px solid rgba(255, 255, 255, 0.3);
    }

    .profile-info h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.blocked {
      background: rgba(0, 0, 0, 0.15);
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      padding: 2rem;
    }

    .info-block {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem;
      background: #f8f9fa;
      border-radius: 12px;
      border: 1px solid #e9ecef;
      transition: all 0.2s;
    }

    .info-block:hover {
      background: #f0f2f5;
      border-color: #4a90e2;
    }

    .info-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
      position: relative;
    }

    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      font-weight: 600;
    }

    .info-value {
      font-size: 15px;
      font-weight: 500;
      color: #1a1a1a;
      word-break: break-word;
    }

    .copy-btn {
      position: absolute;
      right: 0;
      top: 0;
      background: none;
      border: none;
      color: #4a90e2;
      cursor: pointer;
      padding: 4px;
      font-size: 16px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .info-content:hover .copy-btn {
      opacity: 1;
    }

    .copy-btn:active {
      transform: scale(0.95);
    }

    .roles-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Divider */
    .divider {
      height: 1px;
      background: #e9ecef;
      margin: 0 2rem;
    }

    /* Block Info */
    .block-info {
      padding: 2rem;
      background: #fff3f0;
      border-top: 1px solid #ffdbdb;
    }

    .block-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .block-header .material-icons {
      font-size: 28px;
      color: #ff6b6b;
    }

    .block-header h3 {
      margin: 0;
      color: #d9534f;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .block-details {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .block-detail-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: white;
      border-radius: 8px;
      border-left: 4px solid #ff6b6b;
    }

    .block-detail-item .label {
      font-weight: 600;
      color: #666;
      font-size: 13px;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .block-detail-item .value {
      color: #1a1a1a;
      font-size: 14px;
      text-align: right;
      flex: 1;
    }

    .block-detail-item .value.reason {
      font-style: italic;
      color: #d9534f;
      font-weight: 600;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      max-width: 500px;
      margin: 4rem auto;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .empty-state .material-icons {
      font-size: 64px;
      color: #ccc;
    }

    .empty-state h3 {
      margin: 0;
      font-size: 20px;
      color: #333;
    }

    .empty-state p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .detail-page {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
        margin-bottom: 1.5rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .header-title h1 {
        font-size: 1.5rem;
      }

      .header-actions {
        justify-content: stretch;
      }

      .header-actions .btn {
        flex: 1;
      }

      .profile-header {
        flex-direction: column;
        text-align: center;
        padding: 2rem 1.5rem 1.5rem;
      }

      .avatar-large {
        width: 80px;
        height: 80px;
        font-size: 32px;
      }

      .info-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
        padding: 1.5rem;
      }

      .info-block {
        padding: 1rem;
      }

      .block-detail-item {
        flex-direction: column;
      }

      .block-detail-item .value {
        text-align: left;
      }
    }
  `]
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminUserService = inject(AdminUserService);
  private snackBar = inject(MatSnackBar);

  user: UserProfile | null = null;
  loading = signal(false);

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    this.loading.set(true);
    const userId = this.route.snapshot.paramMap.get('id');
    
    if (!userId) {
      this.snackBar.open('Invalid user ID', 'Close', { duration: 3000 });
      this.goBack();
      return;
    }

    this.adminUserService.getUserDetails(Number(userId)).subscribe({
      next: (response) => {
        this.user = response.data as UserProfile;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load user details', 'Close', { duration: 3000 });
        this.loading.set(false);
        this.goBack();
      }
    });
  }

  blockUser() {
    const reason = prompt('Enter reason for blocking this user:');
    if (reason && reason.trim()) {
      this.adminUserService.blockUser(this.user!.userId, reason).subscribe({
        next: () => {
          this.snackBar.open('User blocked successfully', 'Close', { duration: 3000 });
          this.loadUser();
        },
        error: () => {
          this.snackBar.open('Failed to block user', 'Close', { duration: 3000 });
        }
      });
    }
  }

  unblockUser() {
    if (confirm('Are you sure you want to unblock this user?')) {
      this.adminUserService.unblockUser(this.user!.userId).subscribe({
        next: () => {
          this.snackBar.open('User unblocked successfully', 'Close', { duration: 3000 });
          this.loadUser();
        },
        error: () => {
          this.snackBar.open('Failed to unblock user', 'Close', { duration: 3000 });
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }

  getInitials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
  }
}
