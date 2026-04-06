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
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>User Management</h1>
          <p>View and manage user accounts</p>
        </div>
        <div class="header-stats">
          <div class="stat-pill">
            <span class="material-icons">people</span>
            {{ totalUsers }} users
          </div>
          <div class="stat-pill warning">
            <span class="material-icons">block</span>
            {{ blockedCount }} blocked
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="admin-tabs">
        <button class="admin-tab" [class.active]="tab() === 'all'" (click)="tab.set('all'); loadAllUsers()">
          <span class="material-icons">people</span>
          All Users
        </button>
        <button class="admin-tab" [class.active]="tab() === 'blocked'" (click)="tab.set('blocked'); loadBlockedUsers()">
          <span class="material-icons">block</span>
          Blocked Users
          @if (blockedCount > 0) {
            <span class="tab-badge">{{ blockedCount }}</span>
          }
        </button>
      </div>

      <!-- ── All Users Tab ── -->
      @if (tab() === 'all') {
        <div class="search-bar">
          <span class="material-icons">search</span>
          <input [(ngModel)]="searchKeyword" placeholder="Search by name, email, username..." class="search-input" />
        </div>

        @if (loading()) {
          <div class="loading-center"><mat-spinner diameter="48" /></div>
        } @else {
          <div class="users-table">
            <div class="table-header">
              <span>Username</span>
              <span>Email</span>
              <span>Name</span>
              <span>Status</span>
              <span>Joined</span>
              <span>Actions</span>
            </div>
            @for (u of filteredUsers; track u.id) {
              <div class="table-row">
                <div class="user-cell">
                  <div class="avatar">{{ getInitials(u.username) }}</div>
                  <strong>{{ u.username }}</strong>
                </div>
                <span class="email-cell">{{ u.email }}</span>
                <span>{{ u.name || '—' }}</span>
                <span class="status-badge" [class.blocked]="u.isBlocked" [class.active]="!u.isBlocked">
                  {{ u.isBlocked ? 'Blocked' : 'Active' }}
                </span>
                <span class="date-cell">{{ u.createdAt | date:'short' }}</span>
                <div class="row-actions">
                  @if (u.isBlocked) {
                    <button class="btn-unblock" (click)="openUnblockDialog(u)" title="Unblock user">
                      <span class="material-icons">check_circle</span>
                    </button>
                  } @else {
                    <button class="btn-block" (click)="openBlockDialog(u)" title="Block user">
                      <span class="material-icons">block</span>
                    </button>
                  }
                  <button class="btn-view" (click)="viewUserDetails(u.userId)">
                    <span class="material-icons">visibility</span>
                  </button>
                </div>
              </div>
            }
            @empty {
              <div class="empty-state" style="grid-column:1/-1">
                <span class="material-icons">people_outline</span>
                <h3>No users found</h3>
              </div>
            }
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <button [disabled]="!hasPreviousPage" (click)="previousPage()">← Previous</button>
            <span>Page {{ currentPage + 1 }} of {{ totalPages }}</span>
            <button [disabled]="!hasNextPage" (click)="nextPage()">Next →</button>
          </div>
        }
      }

      <!-- ── Blocked Users Tab ── -->
      @if (tab() === 'blocked') {
        @if (loading()) {
          <div class="loading-center"><mat-spinner diameter="48" /></div>
        } @else {
          <div class="users-table">
            <div class="table-header">
              <span>Username</span>
              <span>Email</span>
              <span>Block Reason</span>
              <span>Blocked Date</span>
              <span>Actions</span>
            </div>
            @for (u of blockedUsers; track u.id) {
              <div class="table-row blocked-row">
                <div class="user-cell">
                  <div class="avatar">{{ getInitials(u.username) }}</div>
                  <strong>{{ u.username }}</strong>
                </div>
                <span class="email-cell">{{ u.email }}</span>
                <span class="reason-cell" [title]="u.blockReason">{{ u.blockReason | slice:0:40 }}{{ u.blockReason && u.blockReason.length > 40 ? '...' : '' }}</span>
                <span class="date-cell">{{ u.blockDate | date:'short' }}</span>
                <div class="row-actions">
                  <button class="btn-unblock" (click)="openUnblockDialog(u)">
                    <span class="material-icons">check_circle</span> Unblock
                  </button>
                </div>
              </div>
            }
            @empty {
              <div class="empty-state" style="grid-column:1/-1">
                <span class="material-icons">done_all</span>
                <h3>No blocked users</h3>
                <p>All users are in good standing!</p>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 1.5rem;
    }

    .page-header h1 {
      margin: 0;
      font-size: 2rem;
      color: #333;
    }

    .page-header p {
      margin: 0.5rem 0 0 0;
      color: #666;
      font-size: 0.95rem;
    }

    .header-stats {
      display: flex;
      gap: 1rem;
    }

    .stat-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: #f5f5f5;
      border-radius: 20px;
      font-size: 0.85rem;
      color: #555;
      font-weight: 500;
    }

    .stat-pill.warning {
      background: #fff3cd;
      color: #856404;
    }

    .stat-pill .material-icons {
      font-size: 18px;
    }

    .admin-tabs {
      display: flex;
      gap: 0;
      margin-bottom: 2rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .admin-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      font-weight: 500;
      border-bottom: 3px solid transparent;
      transition: all 0.3s;
      position: relative;
    }

    .admin-tab:hover {
      color: #333;
      background: #f9f9f9;
    }

    .admin-tab.active {
      color: #4a90e2;
      border-bottom-color: #4a90e2;
    }

    .admin-tab .material-icons {
      font-size: 20px;
    }

    .tab-badge {
      display: inline-block;
      background: #ff6b6b;
      color: white;
      border-radius: 10px;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: bold;
      margin-left: 0.5rem;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      width: 100%;
      max-width: 400px;
    }

    .search-bar .material-icons {
      color: #999;
      font-size: 20px;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 0.95rem;
    }

    .users-table {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 2fr 1.5fr 1fr 1.5fr 1.5fr;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      border-bottom: 1px solid #ddd;
      font-weight: 600;
      color: #333;
      font-size: 0.85rem;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 2fr 1.5fr 1fr 1.5fr 1.5fr;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f0f0f0;
      align-items: center;
      transition: background 0.2s;
    }

    .table-row:hover {
      background: #f8f9fa;
    }

    .table-row.blocked-row {
      opacity: 0.75;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    .email-cell {
      font-size: 0.9rem;
      color: #666;
      word-break: break-all;
    }

    .reason-cell {
      font-size: 0.9rem;
      color: #d9534f;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .date-cell {
      font-size: 0.85rem;
      color: #999;
    }

    .status-badge {
      display: inline-block;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      text-align: center;
    }

    .status-badge.active {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-badge.blocked {
      background: #ffebee;
      color: #c62828;
    }

    .row-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .row-actions button {
      padding: 0.5rem 0.75rem;
      border: none;
      border-radius: 4px;
      background: #f0f0f0;
      color: #333;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      transition: all 0.2s;
    }

    .row-actions button .material-icons {
      font-size: 16px;
    }

    .btn-block {
      background: #ffebee;
      color: #d32f2f;
    }

    .btn-block:hover {
      background: #ffcdd2;
    }

    .btn-unblock {
      background: #e8f5e9;
      color: #388e3c;
    }

    .btn-unblock:hover {
      background: #c8e6c9;
    }

    .btn-view {
      background: #e3f2fd;
      color: #1976d2;
    }

    .btn-view:hover {
      background: #bbdefb;
    }

    .loading-center {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 3rem;
      color: #999;
    }

    .empty-state .material-icons {
      font-size: 48px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #666;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.9rem;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-top: 1px solid #ddd;
    }

    .pagination button {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .pagination button:hover:not(:disabled) {
      background: #4a90e2;
      color: white;
      border-color: #4a90e2;
    }

    .pagination button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination span {
      font-size: 0.9rem;
      color: #666;
      min-width: 150px;
      text-align: center;
    }
  `]
})
export class AdminUsersPage implements OnInit {
  
  private adminUserService = inject(AdminUserService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

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

  ngOnInit() {
    this.loadAllUsers();
  }

  loadAllUsers() {
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
      error: (err) => {
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadBlockedUsers() {
    this.loading.set(true);
    this.adminUserService.getBlockedUsers().subscribe({
      next: (response) => {
        this.blockedUsers = response.data as UserProfile[];
        this.blockedCount = this.blockedUsers.length;
        this.loading.set(false);
      },
      error: (err) => {
        this.snackBar.open('Failed to load blocked users', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  openBlockDialog(user: UserProfile) {
    this.router.navigate(['/admin/users', user.userId, 'block']);
  }

  openUnblockDialog(user: UserProfile) {
    this.router.navigate(['/admin/users', user.userId, 'unblock']);
  }

  viewUserDetails(userId: number) {
    this.router.navigate(['/admin/users', userId]);
  }

  nextPage() {
    if (this.hasNextPage) {
      this.currentPage++;
      this.loadAllUsers();
    }
  }

  previousPage() {
    if (this.hasPreviousPage) {
      this.currentPage--;
      this.loadAllUsers();
    }
  }

  getInitials(username: string): string {
    return username?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  }
}
