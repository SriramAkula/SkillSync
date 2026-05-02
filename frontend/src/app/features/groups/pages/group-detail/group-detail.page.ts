import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GroupService } from '../../../../core/services/group.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthStore } from '../../../../core/store/auth.store';
import { SkillStore } from '../../../../core/store/skill.store';
import { GroupDto } from '../../../../shared/models';

@Component({
  selector: 'app-group-detail-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './group-detail.page.html',
  styleUrl: './group-detail.page.scss'
})
export class GroupDetailPage implements OnInit {
  private readonly groupService = inject(GroupService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
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
      next: (r) => { this.group.set(r.data); this.toast.success('Joined group!'); },
      error: (e) => this.toast.error(e.error?.message ?? 'Failed to join')
    });
  }

  leave(id: number): void {
    this.groupService.leaveGroup(id).subscribe({
      next: (r) => { this.group.set(r.data); this.toast.success('Left group.'); },
      error: (e) => this.toast.error(e.error?.message ?? 'Failed to leave')
    });
  }

  deleteGroup(id: number): void {
    this.groupService.deleteGroup(id).subscribe({
      next: () => { this.toast.success('Group deleted.'); this.router.navigate(['/groups']); },
      error: (e) => this.toast.error(e.error?.message ?? 'Failed to delete')
    });
  }
}
