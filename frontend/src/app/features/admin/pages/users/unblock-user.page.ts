import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { AdminUserService, UserProfile } from '../../../../core/services/admin-user.service';
import { ApiResponse } from '../../../../shared/models';

@Component({
  selector: 'app-unblock-user-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unblock-user.page.html',
  styleUrl: './unblock-user.page.scss'
})
export class UnblockUserPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminUserService: AdminUserService = inject(AdminUserService);
  private toast: ToastService = inject(ToastService);

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
      next: (response: ApiResponse<UserProfile>) => {
        this.user = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Failed to load user details');
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
        this.toast.success('User unblocked successfully');
        this.goBack();
      },
      error: () => {
        this.toast.error('Failed to unblock user');
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }
}
