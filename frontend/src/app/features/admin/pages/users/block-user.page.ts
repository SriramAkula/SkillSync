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
  templateUrl: './block-user.page.html',
  styleUrl: './block-user.page.scss'
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
      next: (response: ApiResponse<UserProfile>) => {
        this.user = response.data;
      },
      error: () => {
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
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to block user', 'Close', { duration: 3000 });
      }
    });
  }
}
