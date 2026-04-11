import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminUserService, UserProfile, PagedResponse } from '../../../../core/services/admin-user.service';
import { BlockUserDialogComponent } from './block-user-dialog.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, BlockUserDialogComponent, ConfirmDialogComponent],
  templateUrl: './admin-users.page.html',
  styleUrl: './admin-users.page.scss'
})
export class AdminUsersPage implements OnInit {
  
  private readonly adminUserService = inject(AdminUserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  tab = signal<'all' | 'blocked'>('all');
  loading = signal(false);
  searchKeyword = '';

  users: UserProfile[] = [];
  blockedUsers: UserProfile[] = [];
  currentPage = 0;
  pageSize = 20;
  totalUsers = 0;
  totalPages = 0;
  blockedCount = 0;

  get filteredUsers(): UserProfile[] {
    if (!this.searchKeyword) return this.users;
    const keyword = this.searchKeyword.toLowerCase();
    return this.users.filter(u =>
      u.username?.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword) ||
      u.name?.toLowerCase().includes(keyword)
    );
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  ngOnInit(): void {
    this.loadAllUsers();
  }

  loadAllUsers(): void {
    this.loading.set(true);
    this.adminUserService.getAllUsers(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        const data = response.data as PagedResponse<UserProfile>;
        this.users = data.content;
        this.totalUsers = data.totalElements;
        this.totalPages = data.totalPages;
        this.blockedCount = this.users.filter(u => u.isBlocked).length;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadBlockedUsers(): void {
    this.loading.set(true);
    this.adminUserService.getBlockedUsers().subscribe({
      next: (response) => {
        this.blockedUsers = response.data as UserProfile[];
        this.blockedCount = this.blockedUsers.length;
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load blocked users', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  openBlockDialog(user: UserProfile): void {
    this.router.navigate(['/admin/users', user.userId, 'block']);
  }

  openUnblockDialog(user: UserProfile): void {
    this.router.navigate(['/admin/users', user.userId, 'unblock']);
  }

  viewUserDetails(userId: number): void {
    this.router.navigate(['/admin/users', userId]);
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage++;
      this.loadAllUsers();
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.currentPage--;
      this.loadAllUsers();
    }
  }

  getInitials(username: string): string {
    return username?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  }
}
