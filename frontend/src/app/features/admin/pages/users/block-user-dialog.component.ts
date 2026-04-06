import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-block-user-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="block-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <h2>Block User</h2>
        <button mat-icon-button (click)="cancel()" class="close-btn" aria-label="Close">
          <span class="material-icons">close</span>
        </button>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <!-- Warning Alert -->
        <div class="warning-alert">
          <span class="warning-icon">⚠️</span>
          <div>
            <p class="alert-title">Block Confirmation</p>
            <p class="alert-text">You are about to block this user from the platform.</p>
          </div>
        </div>

        <!-- User Card -->
        <div class="user-card">
          <div class="user-avatar">{{ getInitials(data.username) }}</div>
          <div class="user-details">
            <strong>{{ data.username }}</strong>
            <p class="email">{{ data.email }}</p>
          </div>
        </div>

        <!-- Reason Input -->
        <div class="reason-group">
          <label class="reason-label">⛔ Block Reason (Required)</label>
          <textarea 
            [(ngModel)]="reason" 
            class="reason-textarea"
            placeholder="Enter the reason for blocking this user..."
            rows="4">
          </textarea>
          @if (!reason.trim()) {
            <p class="error-message">Please provide a reason for blocking</p>
          }
        </div>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button mat-stroked-button (click)="cancel()" class="btn-cancel">
          <span class="material-icons">close</span>
          Cancel
        </button>
        <button 
          mat-raised-button 
          color="warn" 
          (click)="confirm()"
          [disabled]="!reason.trim()"
          class="btn-confirm">
          <span class="material-icons">block</span>
          Block User
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .block-dialog {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #eee;
      background: #fafafa;
    }

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .close-btn {
      color: #666;
      width: 40px;
      height: 40px;
    }

    .close-btn:hover {
      color: #1a1a1a;
      background: rgba(0, 0, 0, 0.05);
    }

    /* Content */
    .dialog-content {
      padding: 24px;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Warning Alert */
    .warning-alert {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 6px;
    }

    .warning-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .alert-title {
      margin: 0 0 4px 0;
      font-size: 13px;
      font-weight: 600;
      color: #e65100;
      text-transform: uppercase;
    }

    .alert-text {
      margin: 0;
      font-size: 13px;
      color: #e65100;
    }

    /* User Card */
    .user-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
    }

    .user-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }

    .user-details strong {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: white;
      margin-bottom: 2px;
    }

    .email {
      margin: 0;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
    }

    /* Reason Input */
    .reason-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .reason-label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .reason-textarea {
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
      color: #1a1a1a;
      resize: vertical;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .reason-textarea:focus {
      outline: none;
      border-color: #ff9800;
      box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
    }

    .reason-textarea::placeholder {
      color: #999;
    }

    .error-message {
      margin: 0;
      font-size: 12px;
      color: #d32f2f;
      font-weight: 500;
    }

    /* Footer */
    .dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid #eee;
      background: #fafafa;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    button {
      min-width: 120px;
      border-radius: 6px;
      font-weight: 500;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    button .material-icons {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .btn-confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .block-dialog {
        border-radius: 8px;
      }

      .dialog-header {
        padding: 16px;
      }

      .dialog-content {
        padding: 16px;
        gap: 16px;
      }

      .dialog-footer {
        padding: 12px 16px;
        flex-direction: column;
      }

      button {
        width: 100%;
      }

      .user-card {
        padding: 12px;
      }
    }
  `]
})
export class BlockUserDialogComponent {
  reason = '';

  constructor(
    public dialogRef: MatDialogRef<BlockUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  getInitials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }

  cancel() {
    this.dialogRef.close(null);
  }

  confirm() {
    this.dialogRef.close(this.reason);
  }
}
