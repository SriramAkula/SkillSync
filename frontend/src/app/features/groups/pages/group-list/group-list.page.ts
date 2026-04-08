import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GroupService } from '../../../../core/services/group.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { GroupDto } from '../../../../shared/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-group-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './group-list.page.html',
  styleUrl: './group-list.page.scss'
})
export class GroupListPage implements OnInit {
  private readonly groupService = inject(GroupService);
  readonly authStore = inject(AuthStore);
  readonly skillStore = inject(SkillStore);
  readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly groups = signal<GroupDto[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly showCreate = signal(false);
  readonly creating = signal(false);
  
  readonly selectedCategory = signal('');
  readonly selectedSkillId = signal<number | null>(null);

  newGroupCategory = '';
  newGroup = { name: '', skillId: null as number | null, maxMembers: null as number | null, description: '' };

  readonly categories = computed(() => {
    return [...new Set(this.skillStore.skills().map(s => s.category).filter(Boolean) as string[])].sort();
  });

  readonly filteredSkills = computed(() => {
    const cat = this.selectedCategory();
    return cat ? this.skillStore.skills().filter(s => s.category === cat) : [];
  });

  skillsInCategory(cat: string) {
    return this.skillStore.skills().filter(s => s.category === cat);
  }

  ngOnInit(): void { 
    this.skillStore.loadAll(undefined); 
    this.loadRandomGroups();
  }

  loadRandomGroups(): void {
    this.loading.set(true);
    this.groupService.getRandomGroups(10).subscribe({
      next: (res) => {
        this.groups.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => { 
        this.groups.set([]); 
        this.loading.set(false); 
      }
    });
  }

  onCategoryChange(cat: string): void {
    this.selectedCategory.set(cat);
    this.selectedSkillId.set(null);
  }

  // ── Safe member count (handles both currentMembers and memberCount) ──
  members(g: GroupDto): number {
    const v = g.currentMembers ?? g.memberCount ?? 0;
    return isNaN(Number(v)) ? 0 : Number(v);
  }

  // ── NaN-safe capacity percentage ──
  capacityPct(g: GroupDto): number {
    const m = this.members(g);
    const max = g.maxMembers || 1;
    return Math.min(100, Math.round((m / max) * 100));
  }

  // ── Is the logged-in user the creator? ──
  isCreator(g: GroupDto): boolean {
    const myId = this.authStore.userId();
    return myId !== null && Number(myId) === Number(g.creatorId);
  }

  skillName(skillId: number): string {
    const s = this.skillStore.skills().find(sk => sk.id === skillId);
    return s ? s.skillName : `Skill #${skillId}`;
  }

  loadGroups(): void {
    if (!this.selectedSkillId()) return;
    this.loading.set(true);
    this.searched.set(true);
    
    this.groupService.getGroupsBySkill(this.selectedSkillId()!).subscribe({
      next: (res) => {
        this.groups.set(res.data ?? []);
        this.loading.set(false);
        this.cleanupOldGroups(res.data ?? []);
      },
      error: () => { this.groups.set([]); this.loading.set(false); }
    });
  }

  clearFilters(): void {
    this.selectedCategory.set('');
    this.selectedSkillId.set(null);
    this.searched.set(false);
    this.loadRandomGroups();
  }

  // ── 7-Day Auto-Cleanup Logic ──
  private cleanupOldGroups(list: GroupDto[]): void {
    const myId = Number(this.authStore.userId());
    const now = new Date();
    
    list.forEach(g => {
      if (Number(g.creatorId) === myId && this.members(g) < 2) {
        const createdDate = new Date(g.createdAt);
        const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 7) {
          console.log(`Auto-deleting group ${g.id} (${g.name}) - Under member count for ${diffDays} days.`);
          this.groupService.deleteGroup(g.id).subscribe({
            next: () => {
              this.groups.update(curr => curr.filter(item => item.id !== g.id));
              this.snack.open(`Group '${g.name}' was automatically deleted (remained < 2 members for 7 days)`, 'OK', { duration: 6000 });
            }
          });
        }
      }
    });
  }


  openCreate(): void {
    if (this.authStore.isAdmin()) {
      this.snack.open('Admins cannot create groups.', 'OK', { duration: 3000 });
      return;
    }
    this.newGroupCategory = '';
    this.newGroup = { name: '', skillId: null, maxMembers: null, description: '' };
    this.showCreate.set(true);
    this.skillStore.loadAll(undefined);
  }

  join(id: number): void {
    this.groupService.joinGroup(id).subscribe({
      next: (r) => { this.groups.update(list => list.map(g => g.id === id ? r.data : g)); this.snack.open('Joined group!', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed to join', 'OK', { duration: 3000 })
    });
  }

  leave(id: number): void {
    this.groupService.leaveGroup(id).subscribe({
      next: (r) => { this.groups.update(list => list.map(g => g.id === id ? r.data : g)); this.snack.open('Left group.', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed to leave', 'OK', { duration: 3000 })
    });
  }

  deleteGroup(id: number): void {
    this.groupService.deleteGroup(id).subscribe({
      next: () => { this.groups.update(list => list.filter(g => g.id !== id)); this.snack.open('Group deleted.', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 })
    });
  }

  createGroup(): void {
    console.log('createGroup() triggered with data:', this.newGroup);
    const { name, skillId, maxMembers, description } = this.newGroup;
    
    if (!name || !name.trim()) {
      this.snack.open('Group Name is required.', 'OK', { duration: 3000 });
      return;
    }
    if (!skillId) {
      this.snack.open('Please select a skill.', 'OK', { duration: 3000 });
      return;
    }
    if (!maxMembers || maxMembers < 2) {
      this.snack.open('Max members must be at least 2.', 'OK', { duration: 3000 });
      return;
    }

    this.creating.set(true);
    const payload = { 
      name: name.trim(), 
      skillId: Number(skillId), 
      maxMembers: Number(maxMembers), 
      description 
    };
    
    console.log('Sending creation payload:', payload);

    this.groupService.createGroup(payload).subscribe({
      next: (r) => {
        console.log('Group created successfully:', r.data);
        this.groups.update(list => [r.data, ...list]);
        this.showCreate.set(false);
        this.creating.set(false);
        this.newGroup = { name: '', skillId: null, maxMembers: null, description: '' };
        this.snack.open('Group created successfully!', 'OK', { duration: 3000 });
      },
      error: (e) => { 
        console.error('Group creation failed:', e);
        this.creating.set(false); 
        this.snack.open(e.error?.message ?? 'Failed to create group', 'OK', { duration: 3000 }); 
      }
    });
  }
}
