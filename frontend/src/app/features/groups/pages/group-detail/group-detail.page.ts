import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GroupService } from '../../../../core/services/group.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { GroupDto } from '../../../../shared/models';

@Component({
  selector: 'app-group-detail-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">
      <button class="back-btn" (click)="router.navigate(['/groups'])">
        <span class="material-icons">arrow_back</span> All Groups
      </button>

      @if (loading()) { <div class="loading-center"><mat-spinner diameter="48" /></div> }

      @if (group(); as g) {
        <div class="layout">

          <!-- Main Card -->
          <div class="main-col">
            <div class="group-card">
              <div class="group-header">
                <div class="group-avatar">{{ g.name[0].toUpperCase() }}</div>
                <div class="group-meta">
                  <h2>{{ g.name }}</h2>
                  <p>{{ skillName(g.skillId) }}</p>
                </div>
                <div class="status-badge" [class.inactive]="!g.isActive">
                  {{ g.isActive ? 'Active' : 'Inactive' }}
                </div>
              </div>

              @if (g.description) {
                <p class="group-desc">{{ g.description }}</p>
              }

              <!-- Stats -->
              <div class="stats-row">
                <div class="stat-box">
                  <span class="stat-val">{{ members(g) }}</span>
                  <span class="stat-lbl">Members</span>
                </div>
                <div class="stat-box">
                  <span class="stat-val">{{ g.maxMembers }}</span>
                  <span class="stat-lbl">Capacity</span>
                </div>
                <div class="stat-box" [class.zero]="spotsLeft(g) === 0">
                  <span class="stat-val">{{ spotsLeft(g) }}</span>
                  <span class="stat-lbl">Spots Left</span>
                </div>
              </div>

              <!-- Capacity Bar -->
              <div class="capacity-section">
                <div class="capacity-label">
                  <span>{{ members(g) }}/{{ g.maxMembers }} members</span>
                  <span [class.full-text]="spotsLeft(g) === 0">
                    {{ spotsLeft(g) === 0 ? 'Group is full' : spotsLeft(g) + ' spots available' }}
                  </span>
                </div>
                <div class="capacity-bar">
                  <div class="capacity-fill"
                       [style.width]="capacityPct(g) + '%'"
                       [class.full]="spotsLeft(g) === 0"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions Sidebar -->
          <div class="actions-col">
            <div class="actions-card">
              <h3>Actions</h3>

              <!-- Creator info -->
              @if (isCreator(g)) {
                <div class="creator-note">
                  <span class="material-icons">star</span>
                  <span>You created this group</span>
                </div>
              }

              <!-- Joint/Leave Logic -->
              @if (!isCreator(g)) {
                @if (g.isJoined) {
                  <button class="action-btn secondary" (click)="leave(g.id)">
                    <span class="material-icons">exit_to_app</span>
                    Leave Group
                  </button>
                } @else if (spotsLeft(g) > 0) {
                  <button class="action-btn primary" (click)="join(g.id)">
                    <span class="material-icons">group_add</span>
                    Join Group
                  </button>
                } @else {
                  <div class="full-notice">
                    <span class="material-icons">block</span>
                    This group is full
                  </div>
                }
              }

              <!-- Delete: creator or admin -->
              @if (isCreator(g) || authStore.isAdmin()) {
                <button class="action-btn danger" (click)="deleteGroup(g.id)">
                  <span class="material-icons">delete</span>
                  Delete Group
                </button>
              }

              <button class="action-btn outline" (click)="router.navigate(['/groups'])">
                <span class="material-icons">arrow_back</span>
                Browse Groups
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; }
    .back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #6b7280; font-size: 14px; font-weight: 500; cursor: pointer; padding: 8px 0; margin-bottom: 24px; transition: color 0.15s; }
    .back-btn:hover { color: #4f46e5; }
    .back-btn .material-icons { font-size: 18px; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }

    .layout { display: grid; grid-template-columns: 1fr 260px; gap: 24px; }
    @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } }

    .group-card { background: white; border-radius: 20px; border: 1px solid #e5e7eb; padding: 28px; display: flex; flex-direction: column; gap: 20px; }
    .group-header { display: flex; align-items: center; gap: 16px; }
    .group-avatar { width: 64px; height: 64px; border-radius: 18px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-size: 26px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .group-meta { flex: 1; }
    .group-meta h2 { font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 4px; }
    .group-meta p { font-size: 13px; color: #9ca3af; margin: 0; }
    .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #dcfce7; color: #16a34a; }
    .status-badge.inactive { background: #fee2e2; color: #dc2626; }
    .group-desc { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0; }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .stat-box { background: #f9fafb; border-radius: 12px; padding: 14px; text-align: center; border: 1px solid #e5e7eb; }
    .stat-box.zero .stat-val { color: #dc2626; }
    .stat-val { display: block; font-size: 22px; font-weight: 800; color: #4f46e5; }
    .stat-lbl { font-size: 12px; color: #6b7280; margin-top: 2px; display: block; }

    .capacity-section { display: flex; flex-direction: column; gap: 8px; }
    .capacity-label { display: flex; justify-content: space-between; font-size: 13px; color: #6b7280; }
    .full-text { color: #dc2626; font-weight: 600; }
    .capacity-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .capacity-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #7c3aed); border-radius: 4px; transition: width 0.3s; }
    .capacity-fill.full { background: linear-gradient(90deg, #ef4444, #dc2626); }

    .actions-card { background: white; border-radius: 20px; border: 1px solid #e5e7eb; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .actions-card h3 { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 4px; }

    .creator-note { display: flex; align-items: center; gap: 6px; background: #fef3c7; color: #d97706; padding: 8px 12px; border-radius: 10px; font-size: 13px; font-weight: 600; }
    .creator-note .material-icons { font-size: 16px; }

    .full-notice { display: flex; align-items: center; gap: 6px; background: #fee2e2; color: #dc2626; padding: 10px 12px; border-radius: 10px; font-size: 13px; font-weight: 500; }
    .full-notice .material-icons { font-size: 16px; }

    .action-btn { width: 100%; height: 44px; border-radius: 12px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.15s, background 0.15s; }
    .action-btn .material-icons { font-size: 18px; }
    .action-btn.primary { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; box-shadow: 0 4px 12px rgba(79,70,229,0.3); }
    .action-btn.primary:hover { opacity: 0.9; }
    .action-btn.secondary { background: #f3f4f6; color: #374151; }
    .action-btn.secondary:hover { background: #e5e7eb; }
    .action-btn.danger { background: #fee2e2; color: #dc2626; }
    .action-btn.danger:hover { background: #fecaca; }
    .action-btn.outline { background: white; color: #4f46e5; border: 1.5px solid #c7d2fe; }
    .action-btn.outline:hover { background: #eef2ff; }
  `]
})
export class GroupDetailPage implements OnInit {
  private readonly groupService = inject(GroupService);
  private readonly route = inject(ActivatedRoute);
  private readonly snack = inject(MatSnackBar);
  readonly authStore = inject(AuthStore);
  readonly skillStore = inject(SkillStore);
  readonly router = inject(Router);
  readonly group = signal<GroupDto | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.groupService.getGroup(id).subscribe({
      next: (r) => { this.group.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    if (this.skillStore.skills().length === 0) this.skillStore.loadAll(undefined);
  }

  // ── Safe member count ──
  members(g: GroupDto): number {
    const v = g.currentMembers ?? g.memberCount ?? 0;
    return isNaN(Number(v)) ? 0 : Number(v);
  }

  // ── NaN-safe spots left ──
  spotsLeft(g: GroupDto): number {
    return Math.max(0, (g.maxMembers || 0) - this.members(g));
  }

  // ── NaN-safe capacity % ──
  capacityPct(g: GroupDto): number {
    const max = g.maxMembers || 1;
    return Math.min(100, Math.round((this.members(g) / max) * 100));
  }

  // ── Is logged-in user the creator? ──
  isCreator(g: GroupDto): boolean {
    const myId = this.authStore.userId();
    return myId !== null && Number(myId) === Number(g.creatorId);
  }

  skillName(skillId: number): string {
    const s = this.skillStore.skills().find(sk => sk.id === skillId);
    return s ? s.skillName : `Skill #${skillId}`;
  }

  join(id: number): void {
    this.groupService.joinGroup(id).subscribe({
      next: (r) => { this.group.set(r.data); this.snack.open('Joined group!', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed to join', 'OK', { duration: 3000 })
    });
  }

  leave(id: number): void {
    this.groupService.leaveGroup(id).subscribe({
      next: (r) => { this.group.set(r.data); this.snack.open('Left group.', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed to leave', 'OK', { duration: 3000 })
    });
  }

  deleteGroup(id: number): void {
    this.groupService.deleteGroup(id).subscribe({
      next: () => { this.snack.open('Group deleted.', 'OK', { duration: 3000 }); this.router.navigate(['/groups']); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed to delete', 'OK', { duration: 3000 })
    });
  }
}
