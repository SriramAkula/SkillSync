import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GroupService } from '../../../../core/services/group.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { GroupDto } from '../../../../shared/models';

@Component({
  selector: 'app-group-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Learning Groups</h1>
          <p>Join skill-based groups and learn together</p>
        </div>
        @if (authStore.isMentor() || authStore.isAdmin()) {
          <button class="btn-create" (click)="openCreate()">
            <span class="material-icons">add</span> Create Group
          </button>
        }
      </div>

      <!-- Search by Skill -->
      <div class="search-section">
        <div class="search-bar">
          <span class="material-icons">auto_stories</span>
          @if (skillStore.loading()) {
            <span class="loading-text">Loading skills...</span>
          } @else if (skillStore.skills().length > 0) {
            <select [(ngModel)]="selectedSkillId" class="skill-select">
              <option [ngValue]="null" disabled>Select a skill to find groups...</option>
              @for (s of skillStore.skills(); track s.id) {
                <option [ngValue]="s.id">{{ s.skillName }}{{ s.category ? ' · ' + s.category : '' }}</option>
              }
            </select>
          } @else {
            <input type="number" [(ngModel)]="selectedSkillId" placeholder="Enter Skill ID..." class="search-input" />
          }
          <button class="btn-search" (click)="loadGroups()" [disabled]="!selectedSkillId || loading()">
            @if (loading()) { <mat-spinner diameter="18" /> } @else { Find Groups }
          </button>
        </div>

        @if (skillStore.skills().length > 0) {
          <div class="cat-chips">
            @for (cat of categories(); track cat) {
              <button class="cat-chip" [class.active]="selectedCat() === cat" (click)="filterByCategory(cat)">
                {{ cat }}
              </button>
            }
            @if (selectedCat()) {
              <button class="cat-chip clear" (click)="clearCat()">
                <span class="material-icons">close</span> Clear
              </button>
            }
          </div>
        }
      </div>

      <!-- Groups Grid -->
      @if (groups().length > 0) {
        <div class="groups-grid">
          @for (g of groups(); track g.id) {
            <div class="group-card" (click)="router.navigate(['/groups', g.id])">
              <div class="group-top">
                <div class="group-icon">{{ g.name[0].toUpperCase() }}</div>
                <div class="group-info">
                  <h3>{{ g.name }}</h3>
                  <p>{{ skillName(g.skillId) }}</p>
                </div>
                <div class="member-badge" [class.full]="members(g) >= g.maxMembers">
                  <span class="material-icons">people</span>
                  {{ members(g) }}/{{ g.maxMembers }}
                </div>
              </div>

              @if (g.description) {
                <p class="group-desc">{{ g.description }}</p>
              }

              <div class="spots-row">
                <div class="capacity-bar">
                  <div class="capacity-fill"
                       [style.width]="capacityPct(g) + '%'"
                       [class.full]="members(g) >= g.maxMembers"></div>
                </div>
                <span class="spots-text" [class.full]="members(g) >= g.maxMembers">
                  {{ members(g) >= g.maxMembers ? 'Full' : (g.maxMembers - members(g)) + ' spots left' }}
                </span>
              </div>

              <div class="group-actions" (click)="$event.stopPropagation()">
                <!-- Join: any user, not creator, not full -->
                @if (!isCreator(g)) {
                  <button class="btn-join" (click)="join(g.id)"
                          [disabled]="members(g) >= g.maxMembers">
                    <span class="material-icons">group_add</span>
                    {{ members(g) >= g.maxMembers ? 'Full' : 'Join' }}
                  </button>
                }

                <!-- Creator badge -->
                @if (isCreator(g)) {
                  <span class="creator-badge">
                    <span class="material-icons">star</span> Creator
                  </span>
                }

                <!-- Delete: only creator or admin -->
                @if (isCreator(g) || authStore.isAdmin()) {
                  <button class="btn-delete" (click)="deleteGroup(g.id)">
                    <span class="material-icons">delete</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      } @else if (searched() && !loading()) {
        <div class="empty-state">
          <div class="empty-icon"><span class="material-icons">group_off</span></div>
          <h3>No groups found</h3>
          <p>No groups exist for this skill yet. Be the first to create one!</p>
        </div>
      } @else if (!searched()) {
        <div class="hint-state">
          <div class="hint-icon"><span class="material-icons">group_work</span></div>
          <h3>Find your learning community</h3>
          <p>Select a skill above to discover groups</p>
        </div>
      }

      <!-- Create Group Modal -->
      @if (showCreate()) {
        <div class="modal-overlay" (click)="showCreate.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create Learning Group</h3>
              <button class="modal-close" (click)="showCreate.set(false)">
                <span class="material-icons">close</span>
              </button>
            </div>

            <div class="form">
              <div class="input-group">
                <label class="input-label">Group Name <span class="required">*</span></label>
                <div class="input-wrapper">
                  <span class="material-icons input-icon">group_work</span>
                  <input type="text" [(ngModel)]="newGroup.name" placeholder="e.g. Java Beginners" />
                </div>
              </div>

              <div class="input-group">
                <label class="input-label">Skill <span class="required">*</span></label>
                @if (skillStore.loading()) {
                  <div class="skill-loading"><mat-spinner diameter="16" /><span>Loading skills...</span></div>
                } @else if (skillStore.skills().length > 0) {
                  <div class="select-wrapper">
                    <span class="material-icons select-icon">auto_stories</span>
                    <select [(ngModel)]="newGroup.skillId" class="skill-select-modal">
                      <option [ngValue]="null" disabled>Select a skill...</option>
                      @for (s of skillStore.skills(); track s.id) {
                        <option [ngValue]="s.id">{{ s.skillName }}{{ s.category ? ' · ' + s.category : '' }}</option>
                      }
                    </select>
                    <span class="material-icons select-arrow">expand_more</span>
                  </div>
                } @else {
                  <div class="input-wrapper">
                    <span class="material-icons input-icon">auto_stories</span>
                    <input type="number" [(ngModel)]="newGroup.skillId" placeholder="Enter Skill ID manually" min="1" />
                  </div>
                  <span class="hint-text"><span class="material-icons">info</span>No skills found. Enter ID manually.</span>
                }
              </div>

              <div class="input-group">
                <label class="input-label">Max Members <span class="required">*</span></label>
                <div class="input-wrapper">
                  <span class="material-icons input-icon">people</span>
                  <input type="number" [(ngModel)]="newGroup.maxMembers" placeholder="e.g. 20" min="2" max="100" />
                </div>
              </div>

              <div class="input-group">
                <label class="input-label">Description <span class="optional">(optional)</span></label>
                <div class="input-wrapper textarea-wrap">
                  <textarea [(ngModel)]="newGroup.description"
                            placeholder="What will this group focus on?" rows="3"></textarea>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-modal-cancel" (click)="showCreate.set(false)">Cancel</button>
              <button class="btn-modal-create" (click)="createGroup()"
                      [disabled]="!newGroup.name?.trim() || !newGroup.skillId || !newGroup.maxMembers || creating()">
                @if (creating()) {
                  <mat-spinner diameter="18" /><span>Creating...</span>
                } @else {
                  <span class="material-icons">add</span> Create Group
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-header h1 { font-size: 28px; font-weight: 800; color: #111827; margin: 0 0 4px; }
    .page-header p { color: #6b7280; font-size: 14px; margin: 0; }
    .btn-create { display: flex; align-items: center; gap: 6px; height: 44px; padding: 0 20px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,0.3); transition: opacity 0.2s; }
    .btn-create:hover { opacity: 0.9; }
    .btn-create .material-icons { font-size: 18px; }

    .search-section { display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
    .search-bar { display: flex; align-items: center; gap: 12px; background: white; border-radius: 14px; border: 1px solid #e5e7eb; padding: 8px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .search-bar .material-icons { color: #9ca3af; font-size: 20px; flex-shrink: 0; }
    .skill-select { flex: 1; border: none; outline: none; font-size: 15px; color: #111827; background: transparent; cursor: pointer; appearance: none; }
    .loading-text { flex: 1; font-size: 14px; color: #9ca3af; font-style: italic; }
    .search-input { flex: 1; border: none; outline: none; font-size: 15px; color: #111827; background: transparent; }
    .search-input::placeholder { color: #9ca3af; }
    .btn-search { height: 40px; padding: 0 20px; border-radius: 10px; background: #4f46e5; color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; transition: opacity 0.15s; flex-shrink: 0; }
    .btn-search:disabled { opacity: 0.5; cursor: not-allowed; }

    .cat-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .cat-chip { height: 32px; padding: 0 14px; border-radius: 20px; border: 1.5px solid #e5e7eb; background: white; color: #6b7280; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .cat-chip:hover { border-color: #4f46e5; color: #4f46e5; }
    .cat-chip.active { background: #4f46e5; border-color: #4f46e5; color: white; font-weight: 600; }
    .cat-chip.clear { display: flex; align-items: center; gap: 4px; border-color: #fecaca; color: #dc2626; }
    .cat-chip.clear:hover { background: #fee2e2; }
    .cat-chip.clear .material-icons { font-size: 14px; }

    .groups-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .group-card { background: white; border-radius: 16px; border: 1px solid #e5e7eb; padding: 20px; cursor: pointer; display: flex; flex-direction: column; gap: 12px; transition: box-shadow 0.2s, border-color 0.2s; }
    .group-card:hover { box-shadow: 0 8px 24px rgba(79,70,229,0.1); border-color: #c7d2fe; }

    .group-top { display: flex; align-items: center; gap: 12px; }
    .group-icon { width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-size: 20px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .group-info { flex: 1; min-width: 0; }
    .group-info h3 { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .group-info p { font-size: 12px; color: #9ca3af; margin: 0; }
    .member-badge { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: #6b7280; flex-shrink: 0; }
    .member-badge.full { color: #dc2626; }
    .member-badge .material-icons { font-size: 16px; }

    .group-desc { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .spots-row { display: flex; flex-direction: column; gap: 6px; }
    .capacity-bar { height: 5px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
    .capacity-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #7c3aed); border-radius: 3px; transition: width 0.3s; }
    .capacity-fill.full { background: #ef4444; }
    .spots-text { font-size: 11px; color: #6b7280; font-weight: 500; }
    .spots-text.full { color: #dc2626; font-weight: 600; }

    .group-actions { display: flex; align-items: center; gap: 8px; }
    .btn-join { display: flex; align-items: center; gap: 5px; height: 34px; padding: 0 14px; border-radius: 8px; background: #eef2ff; color: #4f46e5; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    .btn-join:hover:not(:disabled) { background: #e0e7ff; }
    .btn-join:disabled { opacity: 0.5; cursor: not-allowed; background: #f3f4f6; color: #9ca3af; }
    .btn-join .material-icons { font-size: 15px; }
    .creator-badge { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #d97706; background: #fef3c7; padding: 4px 10px; border-radius: 20px; }
    .creator-badge .material-icons { font-size: 14px; }
    .btn-delete { margin-left: auto; width: 34px; height: 34px; border-radius: 8px; background: #fee2e2; color: #dc2626; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
    .btn-delete:hover { background: #fecaca; }
    .btn-delete .material-icons { font-size: 16px; }

    .empty-state, .hint-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 20px; text-align: center; }
    .empty-icon, .hint-icon { width: 72px; height: 72px; border-radius: 20px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
    .empty-icon .material-icons, .hint-icon .material-icons { font-size: 36px; color: #9ca3af; }
    .hint-icon { background: #eef2ff; } .hint-icon .material-icons { color: #4f46e5; }
    .empty-state h3, .hint-state h3 { font-size: 18px; font-weight: 700; color: #111827; margin: 0; }
    .empty-state p, .hint-state p { color: #6b7280; font-size: 14px; margin: 0; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .modal-card { background: white; border-radius: 20px; padding: 28px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-header h3 { font-size: 18px; font-weight: 800; color: #111827; margin: 0; }
    .modal-close { background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
    .modal-close:hover { background: #f3f4f6; }
    .modal-close .material-icons { font-size: 20px; }
    .form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
    .input-group { display: flex; flex-direction: column; gap: 5px; }
    .input-label { font-size: 13px; font-weight: 600; color: #374151; }
    .required { color: #ef4444; }
    .optional { font-size: 11px; color: #9ca3af; font-weight: 400; }
    .input-wrapper { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 0 14px; height: 48px; display: flex; align-items: center; transition: border-color 0.2s; }
    .input-wrapper:focus-within { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); background: white; }
    .input-icon { font-size: 18px; color: #9ca3af; margin-right: 10px; flex-shrink: 0; }
    .input-wrapper input { flex: 1; border: none; outline: none; font-size: 14px; color: #111827; background: transparent; }
    .input-wrapper input::placeholder { color: #9ca3af; }
    .textarea-wrap { height: auto; padding: 12px 14px; align-items: flex-start; }
    .textarea-wrap textarea { flex: 1; border: none; outline: none; font-size: 14px; color: #111827; background: transparent; resize: none; font-family: inherit; width: 100%; }
    .textarea-wrap textarea::placeholder { color: #9ca3af; }
    .select-wrapper { position: relative; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px; height: 48px; display: flex; align-items: center; padding: 0 14px; transition: border-color 0.2s; }
    .select-wrapper:focus-within { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); background: white; }
    .select-icon { font-size: 18px; color: #9ca3af; margin-right: 10px; flex-shrink: 0; }
    .skill-select-modal { flex: 1; border: none; outline: none; font-size: 14px; color: #111827; background: transparent; cursor: pointer; appearance: none; padding-right: 24px; }
    .select-arrow { position: absolute; right: 12px; font-size: 18px; color: #9ca3af; pointer-events: none; }
    .skill-loading { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #9ca3af; padding: 4px 0; }
    .hint-text { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #9ca3af; }
    .hint-text .material-icons { font-size: 14px; }
    .modal-actions { display: flex; gap: 10px; }
    .btn-modal-cancel { flex: 1; height: 48px; border-radius: 12px; background: #f3f4f6; color: #374151; border: none; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-modal-create { flex: 1; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: opacity 0.2s; }
    .btn-modal-create:hover:not(:disabled) { opacity: 0.9; }
    .btn-modal-create:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-modal-create .material-icons { font-size: 18px; }
  `]
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
  readonly selectedCat = signal('');
  readonly creating = signal(false);

  selectedSkillId: number | null = null;
  newGroup = { name: '', skillId: null as number | null, maxMembers: null as number | null, description: '' };

  ngOnInit(): void { this.skillStore.loadAll(undefined); }

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

  categories(): string[] {
    return [...new Set(this.skillStore.skills().map(s => s.category).filter(Boolean) as string[])].sort();
  }

  skillName(skillId: number): string {
    const s = this.skillStore.skills().find(sk => sk.id === skillId);
    return s ? s.skillName : `Skill #${skillId}`;
  }

  loadGroups(): void {
    if (!this.selectedSkillId) return;
    this.loading.set(true);
    this.searched.set(true);
    this.groupService.getGroupsBySkill(this.selectedSkillId).subscribe({
      next: (r) => { this.groups.set(r.data ?? []); this.loading.set(false); },
      error: () => { this.groups.set([]); this.loading.set(false); }
    });
  }

  filterByCategory(cat: string): void {
    this.selectedCat.set(cat);
    const skill = this.skillStore.skills().find(s => s.category === cat);
    if (skill) { this.selectedSkillId = skill.id; this.loadGroups(); }
  }

  clearCat(): void { this.selectedCat.set(''); this.selectedSkillId = null; this.groups.set([]); this.searched.set(false); }

  openCreate(): void {
    this.newGroup = { name: '', skillId: null, maxMembers: null, description: '' };
    this.skillStore.loadAll(undefined);
    this.showCreate.set(true);
  }

  join(id: number): void {
    this.groupService.joinGroup(id).subscribe({
      next: (r) => { this.groups.update(list => list.map(g => g.id === id ? r.data : g)); this.snack.open('Joined group!', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed to join', 'OK', { duration: 3000 })
    });
  }

  deleteGroup(id: number): void {
    this.groupService.deleteGroup(id).subscribe({
      next: () => { this.groups.update(list => list.filter(g => g.id !== id)); this.snack.open('Group deleted.', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 })
    });
  }

  createGroup(): void {
    const { name, skillId, maxMembers, description } = this.newGroup;
    if (!name?.trim() || !skillId || !maxMembers) return;
    this.creating.set(true);
    this.groupService.createGroup({ name: name.trim(), skillId: Number(skillId), maxMembers: Number(maxMembers), description }).subscribe({
      next: (r) => {
        this.groups.update(list => [r.data, ...list]);
        this.showCreate.set(false);
        this.creating.set(false);
        this.newGroup = { name: '', skillId: null, maxMembers: null, description: '' };
        this.snack.open('Group created successfully!', 'OK', { duration: 3000 });
      },
      error: (e) => { this.creating.set(false); this.snack.open(e.error?.message ?? 'Failed to create group', 'OK', { duration: 3000 }); }
    });
  }
}
