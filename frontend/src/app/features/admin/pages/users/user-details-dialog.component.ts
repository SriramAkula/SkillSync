import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface UserDetailsData {
  username?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-user-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './user-details-dialog.component.html',
  styleUrl: './user-details-dialog.component.scss'
})
export class UserDetailsDialogComponent {
  readonly dialogRef = inject(MatDialogRef<UserDetailsDialogComponent>);
  readonly data: UserDetailsData = inject(MAT_DIALOG_DATA);

  getInitials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }

  close(): void {
    this.dialogRef.close();
  }
}
