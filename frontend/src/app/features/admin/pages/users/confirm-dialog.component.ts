import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="confirm-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <h2>{{ data.title }}</h2>
        <button mat-icon-button (click)="cancel()" class="close-btn" aria-label="Close">
          <span class="material-icons">close</span>
        </button>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <div class="alert-icon">⚠️</div>
        <p class="message">{{ data.message }}</p>
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
          class="btn-confirm">
          <span class="material-icons">check</span>
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .confirm-dialog {
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
      padding: 40px 24px;
      flex: 1;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    .alert-icon {
      font-size: 48px;
      line-height: 1;
    }

    .message {
      margin: 0;
      color: #666;
      font-size: 15px;
      line-height: 1.6;
      max-width: 400px;
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

    /* Responsive */
    @media (max-width: 480px) {
      .confirm-dialog {
        border-radius: 8px;
      }

      .dialog-header {
        padding: 16px;
      }

      .dialog-content {
        padding: 32px 16px;
      }

      .dialog-footer {
        padding: 12px 16px;
        flex-direction: column;
      }

      button {
        width: 100%;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  cancel() {
    this.dialogRef.close(false);
  }

  confirm() {
    this.dialogRef.close(true);
  }
}
