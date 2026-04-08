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
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
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
