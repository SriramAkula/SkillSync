import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface BlockUserDialogData {
  username?: string;
  email?: string;
  userId?: number;
}

@Component({
  selector: 'app-block-user-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './block-user-dialog.component.html',
  styleUrl: './block-user-dialog.component.scss'
})
export class BlockUserDialogComponent {
  readonly dialogRef = inject(MatDialogRef<BlockUserDialogComponent>);
  readonly data: BlockUserDialogData = inject(MAT_DIALOG_DATA);
  reason = '';

  getInitials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    this.dialogRef.close(this.reason);
  }
}
