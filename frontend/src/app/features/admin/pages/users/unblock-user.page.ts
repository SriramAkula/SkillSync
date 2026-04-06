import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminUserService, UserProfile } from '../../../../core/services/admin-user.service';

@Component({
  selector: 'app-unblock-user-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="unblock-page-container">
      <!-- Page Header -->
      <div class="page-header">
        <button class="back-button" (click)="goBack()" [disabled]="isLoading">
          <span class="material-icons">arrow_back</span>
          Back
        </button>
      </div>

      <!-- Page Content -->
      <div class="page-content">
        <div class="unblock-card" *ngIf="user">
          <!-- Card Header -->
          <div class="card-header">
            <div class="header-icon success">✓</div>
            <div class="header-text">
              <h1>Unblock User</h1>
              <p>Restore this user's access to the platform</p>
            </div>
          </div>

          <!-- User Section -->
          <div class="user-section">
            <div class="section-title">User Information</div>
            <div class="user-card">
              <div class="avatar-container">
                <div class="avatar-large" [style.background]="getGradientColor(user.username)">
                  {{ getUserInitials() }}
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
                <div class="detail-row">
                  <span class="label">Full Name</span>
                  <span class="value">{{ user.name }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status</span>
                  <span class="status-blocked">
                    <span class="material-icons">block</span>
                    Blocked
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Block Info Section -->
          <div class="info-section">
            <div class="info-content">
              <h3>Block Details</h3>
              <div class="detail-item">
                <span class="detail-label">Block Reason:</span>
                <span class="detail-value">{{ user.blockReason || 'No reason provided' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Blocked Date:</span>
                <span class="detail-value">{{ user.blockDate | date:'medium' || 'Unknown' }}</span>
              </div>
            </div>
          </div>

          <!-- Confirmation Section -->
          <div class="confirmation-section">
            <div class="confirmation-content">
              <h3>What happens after unblocking?</h3>
              <ul>
                <li>User will regain full access to the platform</li>
                <li>User can log in to their account again</li>
                <li>User can view past sessions and courses</li>
                <li>User will receive notifications normally</li>
                <li>This action will be logged for audit purposes</li>
              </ul>
            </div>
          </div>

          <!-- Button Group -->
          <div class="button-group">
            <button class="btn btn-cancel" (click)="goBack()" [disabled]="isLoading">
              Cancel
            </button>
            <button class="btn btn-success" 
                    (click)="onUnblockUser()" 
                    [disabled]="isLoading">
              @if (isLoading) {
                <mat-spinner diameter="16"></mat-spinner>
                Unblocking...
              } @else {
                <span class="material-icons">check_circle</span>
                Unblock User
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unblock-page-container {
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
    }

    .back-button:hover:not(:disabled) {
      background: #3a3a4e;
      border-color: #666;
    }

    .back-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .back-button .material-icons {
      font-size: 20px;
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

    .unblock-card {
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
      background: #1f3a1f;
      color: #4caf50;
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
    .info-section,
    .confirmation-section {
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
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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

    .status-blocked {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #ef5350;
      background: #3a1f1f;
      padding: 4px 8px;
      border-radius: 4px;
      width: fit-content;
    }

    .status-blocked .material-icons {
      font-size: 16px;
    }

    /* Info Section */
    .info-section {
      background: #2a2a3e;
    }

    .info-content h3 {
      margin: 0 0 16px 0;
      color: #b0b0b0;
      font-size: 16px;
    }

    .detail-item {
      display: flex;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #3a3a4e;
    }

    .detail-item:last-child {
      border-bottom: none;
    }

    .detail-label {
      color: #888;
      font-size: 13px;
      font-weight: 600;
      min-width: 140px;
    }

    .detail-value {
      color: #e0e0e0;
      font-size: 13px;
      flex: 1;
      word-break: break-word;
    }

    /* Confirmation Section */
    .confirmation-section {
      background: #2a3a2a;
      border-left: 4px solid #4caf50;
    }

    .confirmation-content h3 {
      margin: 0 0 12px 0;
      color: #81c784;
      font-size: 16px;
    }

    .confirmation-content ul {
      margin: 0;
      padding-left: 20px;
      color: #a5d6a7;
      font-size: 13px;
      line-height: 1.8;
    }

    .confirmation-content li {
      margin-bottom: 6px;
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
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-cancel {
      background: #3a3a4e;
      color: #e0e0e0;
      border: 1px solid #444;
    }

    .btn-cancel:hover:not(:disabled) {
      background: #4a4a5e;
      border-color: #666;
    }

    .btn-success {
      background: #4caf50;
      color: white;
      min-width: 160px;
    }

    .btn-success:hover:not(:disabled) {
      background: #388e3c;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.5);
    }

    .btn-success .material-icons {
      font-size: 20px;
    }

    mat-spinner {
      display: inline-block;
    }

    @media (max-width: 600px) {
      .unblock-page-container {
        padding: 16px;
      }

      .unblock-card {
        max-width: 100%;
      }

      .card-header,
      .user-section,
      .info-section,
      .confirmation-section,
      .button-group {
        padding: 20px;
      }

      .user-card {
        flex-direction: column;
        gap: 16px;
      }

      .button-group {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class UnblockUserPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminUserService: AdminUserService = inject(AdminUserService);
  private snackBar: MatSnackBar = inject(MatSnackBar);

  user: UserProfile | null = null;
  isLoading = false;

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUser(+userId);
    }
  }

  loadUser(userId: number) {
    this.isLoading = true;
    this.adminUserService.getUserDetails(userId).subscribe({
      next: (response: any) => {
        this.user = response.data;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.snackBar.open('Failed to load user details', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  getUserInitials(): string {
    if (!this.user) return '';
    const name = this.user.name || this.user.username;
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getGradientColor(username: string): string {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    const hash = username.charCodeAt(0) % colors.length;
    return colors[hash];
  }

  onUnblockUser() {
    if (!this.user) return;

    this.isLoading = true;
    this.adminUserService.unblockUser(this.user.userId).subscribe({
      next: () => {
        this.snackBar.open('User unblocked successfully', 'Close', { duration: 3000 });
        this.goBack();
      },
      error: (err: any) => {
        this.snackBar.open('Failed to unblock user', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }
}
