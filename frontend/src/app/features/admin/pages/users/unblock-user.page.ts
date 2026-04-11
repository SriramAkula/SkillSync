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
  templateUrl: './unblock-user.page.html',
  styleUrl: './unblock-user.page.scss'
})
export class UnblockUserPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminUserService = inject(AdminUserService);
  private readonly snackBar = inject(MatSnackBar);

  user: UserProfile | null = null;
  isLoading = false;

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUser(+userId);
    }
  }

  loadUser(userId: number): void {
    this.isLoading = true;
    this.adminUserService.getUserDetails(userId).subscribe({
      next: (response: { data: UserProfile }) => {
        this.user = response.data;
        this.isLoading = false;
      },
      error: () => {
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
      error: () => {
        this.snackBar.open('Failed to unblock user', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }
}
