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
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Learning Groups</h1>
          <p>Join skill-based groups and learn together</p>
        </div>
      </div>

      <!-- Search by Category & Skill -->
      <div class="search-section category-search">
        <div class="search-bar">
          <!-- Category Select -->
          <div class="dropdown-wrap">
            <span class="material-icons select-icon">category</span>
            <select [ngModel]="selectedCategory()" (ngModelChange)="onCategoryChange($event)" class="search-select">
              <option value="" disabled selected>Select Category...</option>
              @for (cat of categories(); track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>

          <!-- Skill Select (Dependent) -->
          <div class="dropdown-wrap" [class.disabled]="!selectedCategory()">
            <span class="material-icons select-icon">auto_stories</span>
            <select [ngModel]="selectedSkillId()" (ngModelChange)="selectedSkillId.set($event)" 
                    class="search-select" [disabled]="!selectedCategory()">
              <option [ngValue]="null" disabled selected>
                {{ !selectedCategory() ? 'Select category first...' : 'Select Skill...' }}
              </option>
              @for (s of filteredSkills(); track s.id) {
                <option [ngValue]="s.id">{{ s.skillName }}</option>
              }
            </select>
          </div>

          <button class="btn-search" (click)="loadGroups()" [disabled]="!selectedSkillId() || loading()">
            @if (loading()) { <mat-spinner diameter="18" /> } @else { Find Groups }
          </button>
          
          @if (!authStore.isAdmin() && (authStore.isLearner() || authStore.isMentor())) {
            <button class="btn-create" (click)="openCreate()">
              <span class="material-icons">add</span> Create Group
            </button>
          }
        </div>
      </div>

      <!-- Groups Grid -->
      @if (groups().length > 0) {
        <div class="section-header" *ngIf="!searched()">
          <span class="material-icons">explore</span>
          <h2>Recommended for You</h2>
        </div>
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
                  <button class="btn-delete" (click)="deleteGroup(g.id)" 
                          title="Only group creator or admin can delete">
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
      } @else if (!searched() && !loading()) {
        <div class="empty-state">
          <div class="empty-icon"><span class="material-icons">group_work</span></div>
          <h3>Welcome to Groups</h3>
          <p>No groups available yet. Create one to get started!</p>
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
                <label class="input-label">Category <span class="required">*</span></label>
                <div class="select-wrapper">
                  <span class="material-icons select-icon">category</span>
                  <select [(ngModel)]="newGroupCategory" class="skill-select-modal" 
                          (change)="newGroup.skillId = null">
                    <option [value]="''" disabled>Select Category...</option>
                    @for (cat of categories(); track cat) {
                      <option [value]="cat">{{ cat }}</option>
                    }
                  </select>
                  <span class="material-icons select-arrow">expand_more</span>
                </div>
              </div>

              <div class="input-group">
                <label class="input-label">Skill <span class="required">*</span></label>
                <div class="select-wrapper" [class.disabled]="!newGroupCategory">
                  <span class="material-icons select-icon">auto_stories</span>
                  <select [(ngModel)]="newGroup.skillId" class="skill-select-modal" [disabled]="!newGroupCategory">
                    <option [ngValue]="null" disabled>
                      {{ !newGroupCategory ? 'Select category first...' : 'Select Target Skill...' }}
                    </option>
                    @for (s of skillsInCategory(newGroupCategory); track s.id) {
                      <option [ngValue]="s.id">{{ s.skillName }}</option>
                    }
                  </select>
                  <span class="material-icons select-arrow">expand_more</span>
                </div>
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
                      [disabled]="creating()">
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
    </div> `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; padding: 0 1rem; }
    @media (min-width: 640px) { .page { padding: 0 1.5rem; } }
    @media (min-width: 1024px) { .page { padding: 0 2rem; } }

    :host-context(.dark) .page-header h1 { color: #f3f4f6; }
    .page-header p { color: #6b7280; font-size: 0.875rem; margin: 0; }
    @media (min-width: 640px) { .page-header p { font-size: 0.875rem; } }

    .section-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; color: #4f46e5; }
    .section-header .material-icons { font-size: 1.25rem; }
    .section-header h2 { font-size: 1.125rem; font-weight: 700; margin: 0; }
    :host-context(.dark) .section-header { color: #818cf8; }

    :host-context(.dark) .page-header p { color: #d1d5db; }
    .btn-create { display: flex; align-items: center; gap: 0.375rem; height: 2.75rem; padding: 0 1.25rem; border-radius: 0.75rem; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; font-size: 0.875rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,0.3); transition: opacity 0.2s; }
    @media (min-width: 640px) { .btn-create { font-size: 0.875rem; } }

    .btn-create:hover { opacity: 0.9; }
    .btn-create .material-icons { font-size: 1.125rem; }

    .search-section { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.75rem; }
    .search-bar { display: flex; align-items: center; gap: 0.75rem; background: white; border-radius: 0.875rem; border: 1px solid #e5e7eb; padding: 0.5rem 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); flex-wrap: wrap; }
    @media (min-width: 640px) { .search-bar { flex-wrap: nowrap; padding: 0.75rem 1rem; } }
    
    .dropdown-wrap { flex: 1; min-w-[150px]; display: flex; align-items: center; gap: 0.625rem; border-right: 1px solid #f3f4f6; padding-right: 0.75rem; }
    @media (min-width: 640px) { .dropdown-wrap { min-w-auto; } }

    .dropdown-wrap:last-of-type { border-right: none; }
    .dropdown-wrap.disabled { opacity: 0.5; }
    .select-icon { color: #9ca3af; font-size: 1.125rem; }
    .search-select { flex: 1; border: none; outline: none; background: transparent; font-size: 0.875rem; color: #111827; height: 2rem; cursor: pointer; min-w-[120px]; }
    @media (min-width: 640px) { .search-select { font-size: 0.875rem; } }

    .search-select:disabled { cursor: not-allowed; }

    .loading-text { flex: 1; font-size: 0.875rem; color: #9ca3af; font-style: italic; }
    .search-input { flex: 1; border: none; outline: none; font-size: 0.875rem; color: #111827; background: transparent; min-w-[100px]; }
    @media (min-width: 640px) { .search-input { font-size: 0.9375rem; } }

    .search-input::placeholder { color: #9ca3af; }
    .btn-search { height: 2.5rem; padding: 0 1.25rem; border-radius: 0.625rem; background: #4f46e5; color: white; border: none; font-size: 0.875rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.375rem; white-space: nowrap; transition: opacity 0.15s; flex-shrink: 0; }
    @media (min-width: 640px) { .btn-search { height: 2.5rem; padding: 0 1.25rem; font-size: 0.875rem; } }

    .btn-search:disabled { opacity: 0.5; cursor: not-allowed; }

    .cat-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .cat-chip { height: 2rem; padding: 0 0.875rem; border-radius: 1.25rem; border: 1.5px solid #e5e7eb; background: white; color: #6b7280; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    @media (min-width: 640px) { .cat-chip { font-size: 0.75rem; } }

    .cat-chip:hover { border-color: #4f46e5; color: #4f46e5; }
    .cat-chip.active { background: #4f46e5; border-color: #4f46e5; color: white; font-weight: 600; }
    .cat-chip.clear { display: flex; align-items: center; gap: 0.25rem; border-color: #fecaca; color: #dc2626; }
    .cat-chip.clear:hover { background: #fee2e2; }
    .cat-chip.clear .material-icons { font-size: 0.875rem; }

    .groups-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    @media (min-width: 640px) { .groups-grid { grid-template-columns: repeat(2, 1fr); gap: 1.25rem; } }
    @media (min-width: 1024px) { .groups-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; } }

    .group-card { background: white; border-radius: 1rem; border: 1px solid #e5e7eb; padding: 1.25rem; cursor: pointer; display: flex; flex-direction: column; gap: 0.75rem; transition: box-shadow 0.2s, border-color 0.2s; }
    @media (min-width: 640px) { .group-card { padding: 1.25rem; } }

    .group-card:hover { box-shadow: 0 8px 24px rgba(79,70,229,0.1); border-color: #c7d2fe; }

    .group-top { display: flex; align-items: center; gap: 0.75rem; }
    .group-icon { width: 3rem; height: 3rem; border-radius: 0.875rem; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    @media (min-width: 640px) { .group-icon { width: 3.5rem; height: 3.5rem; } }

    .group-info { flex: 1; min-width: 0; }
    .group-info h3 { font-size: 0.9375rem; font-weight: 700; color: #111827; margin: 0 0 0.125rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @media (min-width: 640px) { .group-info h3 { font-size: 0.9375rem; } }

    .group-info p { font-size: 0.75rem; color: #9ca3af; margin: 0; }
    .member-badge { display: flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; font-weight: 600; color: #6b7280; flex-shrink: 0; }
    @media (min-width: 640px) { .member-badge { font-size: 0.8125rem; } }

    .member-badge.full { color: #dc2626; }
    .member-badge .material-icons { font-size: 1rem; }

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
    .btn-delete .material-icons { font-size: 1rem; }

    .empty-state, .hint-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem 1.25rem; text-align: center; }
    @media (min-width: 640px) { .empty-state, .hint-state { padding: 5rem 1.25rem; } }

    .empty-icon, .hint-icon { width: 4.5rem; height: 4.5rem; border-radius: 1.25rem; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
    .empty-icon .material-icons, .hint-icon .material-icons { font-size: 2rem; color: #9ca3af; }
    .hint-icon { background: #eef2ff; } .hint-icon .material-icons { color: #4f46e5; }
    .empty-state h3, .hint-state h3 { font-size: 1.125rem; font-weight: 700; color: #111827; margin: 0; }
    @media (min-width: 640px) { .empty-state h3, .hint-state h3 { font-size: 1.125rem; } }

    .empty-state p, .hint-state p { color: #6b7280; font-size: 0.875rem; margin: 0; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal-card { background: white; border-radius: 1.25rem; padding: 1.75rem; width: 100%; max-width: 30rem; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
    @media (min-width: 640px) { .modal-card { border-radius: 1.25rem; padding: 1.75rem; } }

    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .modal-header h3 { font-size: 1.125rem; font-weight: 800; color: #111827; margin: 0; }
    @media (min-width: 640px) { .modal-header h3 { font-size: 1.125rem; } }

    .modal-close { background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; padding: 0.25rem; border-radius: 0.375rem; }
    .modal-close:hover { background: #f3f4f6; }
    .modal-close .material-icons { font-size: 1.25rem; }
    .form { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem; }
    .input-group { display: flex; flex-direction: column; gap: 0.3125rem; }
    .input-label { font-size: 0.8125rem; font-weight: 600; color: #374151; }
    .required { color: #ef4444; }
    .optional { font-size: 0.6875rem; color: #9ca3af; font-weight: 400; }
    .input-wrapper { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 0.75rem; padding: 0 0.875rem; height: 3rem; display: flex; align-items: center; transition: border-color 0.2s; }
    @media (min-width: 640px) { .input-wrapper { height: 3rem; } }

    .input-wrapper:focus-within { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); background: white; }
    .input-icon { font-size: 1.125rem; color: #9ca3af; margin-right: 0.625rem; flex-shrink: 0; }
    .input-wrapper input { flex: 1; border: none; outline: none; font-size: 0.875rem; color: #111827; background: transparent; }
    @media (min-width: 640px) { .input-wrapper input { font-size: 0.875rem; } }

    .input-wrapper input::placeholder { color: #9ca3af; }
    .textarea-wrap { height: auto; padding: 0.75rem 0.875rem; align-items: flex-start; }
    .textarea-wrap textarea { flex: 1; border: none; outline: none; font-size: 0.875rem; color: #111827; background: transparent; resize: none; font-family: inherit; width: 100%; }
    .textarea-wrap textarea::placeholder { color: #9ca3af; }
    .select-wrapper { position: relative; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 0.75rem; height: 3rem; display: flex; align-items: center; padding: 0 0.875rem; transition: border-color 0.2s; }
    @media (min-width: 640px) { .select-wrapper { height: 3rem; } }

    .select-wrapper:focus-within { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); background: white; }
    .select-icon { font-size: 1.125rem; color: #9ca3af; margin-right: 0.625rem; flex-shrink: 0; }
    .skill-select-modal { flex: 1; border: none; outline: none; font-size: 0.875rem; color: #111827; background: transparent; cursor: pointer; appearance: none; padding-right: 1.5rem; }
    @media (min-width: 640px) { .skill-select-modal { font-size: 0.875rem; } }

    .select-arrow { position: absolute; right: 0.75rem; font-size: 1.125rem; color: #9ca3af; pointer-events: none; }
    .skill-loading { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #9ca3af; padding: 0.25rem 0; }
    .hint-text { display: flex; align-items: center; gap: 0.3125rem; font-size: 0.75rem; color: #9ca3af; }
    .hint-text .material-icons { font-size: 0.875rem; }
    .modal-actions { display: flex; gap: 0.625rem; flex-direction: column; }
    @media (min-width: 640px) { .modal-actions { flex-direction: row; } }

    .btn-modal-cancel { flex: 1; height: 3rem; border-radius: 0.75rem; background: #f3f4f6; color: #374151; border: none; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    @media (min-width: 640px) { .btn-modal-cancel { height: 3rem; font-size: 0.875rem; } }

    .btn-modal-create { flex: 1; height: 3rem; border-radius: 0.75rem; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; font-size: 0.875rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.375rem; transition: opacity 0.2s; }
    @media (min-width: 640px) { .btn-modal-create { height: 3rem; font-size: 0.875rem; } }

    .btn-modal-create:hover:not(:disabled) { opacity: 0.9; }
    .btn-modal-create:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-modal-create .material-icons { font-size: 1.125rem; }
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
