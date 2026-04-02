import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SkillService } from '../../../../core/services/skill.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { UserService } from '../../../../core/services/user.service';
import { SkillDto, CreateSkillRequest } from '../../../../shared/models/skill.models';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-skill-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Skills</h1>
          <p>Browse and discover skills to learn</p>
        </div>
        @if (authStore.isAdmin()) {
          <button class="btn-add" (click)="openCreate()">
            <span class="material-icons">add</span> Add Skill
          </button>
        }
      </div>

      <!-- Search + Category Filter -->
      <div class="toolbar">
        <div class="search-bar">
          <span class="material-icons">search</span>
          <input [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)"
                 placeholder="Search skills..." class="search-input" />
          @if (searchQuery) {
            <button class="clear-btn" (click)="clearSearch()">
              <span class="material-icons">close</span>
            </button>
          }
        </div>

        <div class="category-chips">
          <button class="chip" [class.active]="selectedCategory() === '' && !showMySkills()"
                  (click)="filterByCategory('', false)">All</button>
                  
          <button class="chip my-skills-chip" [class.active]="showMySkills()"
                  (click)="filterByCategory('', true)">
            <span class="material-icons star-icon">star</span>
            My Skills
          </button>
          
          @for (cat of categories(); track cat) {
            <button class="chip" [class.active]="selectedCategory() === cat && !showMySkills()"
                    (click)="filterByCategory(cat, false)">{{ cat }}</button>
          }
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-bar">
        <span class="stat-text">
          <strong>{{ filteredSkills().length }}</strong> skills
          @if (searchQuery) { matching "<em>{{ searchQuery }}</em>" }
          @if (selectedCategory()) { in <em>{{ selectedCategory() }}</em> }
          @if (showMySkills()) { inside your profile }
        </span>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      }

      <!-- Skills Grid -->
      @if (!loading()) {
        <div class="skills-grid">
          @for (skill of filteredSkills(); track skill.id) {
            <div class="skill-card" (click)="selectSkill(skill)">
              <div class="skill-top">
                <div class="skill-icon">{{ skill.skillName[0].toUpperCase() }}</div>
                <div class="tags-wrap">
                  @if (skill.popularityScore >= 50) {
                    <span class="popular-tag"><span class="material-icons">local_fire_department</span> Popular</span>
                  }
                  @if (skill.category) {
                    <span class="category-tag">{{ skill.category }}</span>
                  }
                </div>
              </div>
              <h3 class="skill-name">{{ skill.skillName }}</h3>
              @if (skill.description) {
                <p class="skill-desc">{{ skill.description }}</p>
              }
              <div class="skill-footer">
                <div class="popularity">
                  <span class="material-icons">trending_up</span>
                  {{ skill.popularityScore }} learners
                </div>
                <div class="action-wrap">
                  @if (authStore.isAdmin()) {
                    <div class="admin-actions">
                      <button class="btn-edit" (click)="$event.stopPropagation(); openEdit(skill)">
                        <span class="material-icons">edit</span>
                      </button>
                      <button class="btn-delete" (click)="$event.stopPropagation(); deleteSkill(skill.id)">
                        <span class="material-icons">delete</span>
                      </button>
                    </div>
                  }
                  <button class="btn-add-skill" [class.added]="isSkillSelected(skill.skillName)" (click)="$event.stopPropagation(); toggleProfileSkill(skill.skillName)">
                    @if (isSkillSelected(skill.skillName)) {
                      <span class="material-icons">check</span> Added
                    } @else {
                      <span class="material-icons">add</span> Add
                    }
                  </button>
                </div>
              </div>
            </div>
          }
          @empty {
            <div class="empty-state">
              <div class="empty-icon"><span class="material-icons">search_off</span></div>
              <h3>No skills found</h3>
              <p>
                @if (searchQuery) { No results match "{{ searchQuery }}" }
                @else if (selectedCategory()) { No skills found in this category }
                @else if (showMySkills()) { You haven't added any skills to your profile yet! }
                @else { No skills available. Please add skills in backend. }
              </p>
              @if (searchQuery || selectedCategory() || showMySkills()) {
                <button class="btn-clear" (click)="clearAll()">Clear filters</button>
              }
            </div>
          }
        </div>
      }

      <!-- Skill Detail Drawer -->
      @if (selectedSkill()) {
        <div class="drawer-overlay" (click)="selectedSkill.set(null)">
          <div class="drawer" (click)="$event.stopPropagation()">
            <div class="drawer-header">
              <div class="drawer-icon">{{ selectedSkill()!.skillName[0].toUpperCase() }}</div>
              <div>
                <h2>{{ selectedSkill()!.skillName }}</h2>
                @if (selectedSkill()!.category) {
                  <span class="drawer-category">{{ selectedSkill()!.category }}</span>
                }
              </div>
              <button class="drawer-close" (click)="selectedSkill.set(null)">
                <span class="material-icons">close</span>
              </button>
            </div>

            @if (selectedSkill()!.description) {
              <p class="drawer-desc">{{ selectedSkill()!.description }}</p>
            }

            <div class="drawer-stats">
              <div class="drawer-stat">
                <span class="material-icons">trending_up</span>
                <div>
                  <strong>{{ selectedSkill()!.popularityScore }}</strong>
                  <span>Learners</span>
                </div>
              </div>
              <div class="drawer-stat">
                <span class="material-icons">calendar_today</span>
                <div>
                  <strong>{{ selectedSkill()!.createdAt | date:'mediumDate' }}</strong>
                  <span>Added</span>
                </div>
              </div>
            </div>

            <div class="drawer-actions">
              <button class="btn-find-mentors" (click)="findMentors(selectedSkill()!.skillName)">
                <span class="material-icons">people</span>
                Find Mentors for this Skill
              </button>
              <button class="btn-find-groups" (click)="findGroups(selectedSkill()!.id)">
                <span class="material-icons">group_work</span>
                Browse Learning Groups
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Create / Edit Modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="showForm.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingSkill() ? 'Edit Skill' : 'Add New Skill' }}</h3>
              <button class="modal-close" (click)="showForm.set(false)">
                <span class="material-icons">close</span>
              </button>
            </div>

            <div class="form">
              <div class="input-group">
                <label class="input-label">Skill Name <span class="required">*</span></label>
                <div class="input-wrapper">
                  <span class="material-icons input-icon">auto_stories</span>
                  <input type="text" [(ngModel)]="formData.skillName" placeholder="e.g. Java, React, AWS" />
                </div>
              </div>
              <div class="input-group">
                <label class="input-label">Category</label>
                <div class="input-wrapper">
                  <span class="material-icons input-icon">category</span>
                  <input type="text" [(ngModel)]="formData.category" placeholder="e.g. Programming, Design, Data Science" />
                </div>
              </div>
              <div class="input-group">
                <label class="input-label">Description</label>
                <div class="input-wrapper textarea-wrap">
                  <textarea [(ngModel)]="formData.description" placeholder="Brief description of this skill..." rows="3"></textarea>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-modal-cancel" (click)="showForm.set(false)">Cancel</button>
              <button class="btn-modal-save" (click)="saveSkill()" [disabled]="!formData.skillName || saving()">
                @if (saving()) { <mat-spinner diameter="18" /> }
                @else {
                  <span class="material-icons">{{ editingSkill() ? 'save' : 'add' }}</span>
                  {{ editingSkill() ? 'Update Skill' : 'Create Skill' }}
                }
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; }

    /* Header */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .page-header h1 { font-size: 28px; font-weight: 800; color: #111827; margin: 0 0 4px; }
    .page-header p { color: #6b7280; font-size: 14px; margin: 0; }
    .btn-add { display: flex; align-items: center; gap: 6px; height: 44px; padding: 0 20px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,0.3); transition: opacity 0.2s; }
    .btn-add:hover { opacity: 0.9; }
    .btn-add .material-icons { font-size: 18px; }

    /* Toolbar */
    .toolbar { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    .search-bar { display: flex; align-items: center; gap: 10px; background: white; border-radius: 14px; border: 1px solid #e5e7eb; padding: 0 16px; height: 52px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .search-bar .material-icons { color: #9ca3af; font-size: 22px; flex-shrink: 0; }
    .search-input { flex: 1; border: none; outline: none; font-size: 15px; color: #111827; background: transparent; }
    .search-input::placeholder { color: #9ca3af; }
    .clear-btn { background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
    .clear-btn:hover { color: #374151; background: #f3f4f6; }
    .clear-btn .material-icons { font-size: 18px; }

    .category-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip { height: 34px; padding: 0 14px; border-radius: 20px; border: 1.5px solid #e5e7eb; background: white; color: #6b7280; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .chip:hover { border-color: #4f46e5; color: #4f46e5; }
    .chip.active { background: #4f46e5; border-color: #4f46e5; color: white; font-weight: 600; }
    
    .my-skills-chip { display: flex; align-items: center; }
    .my-skills-chip .star-icon { font-size: 14px; margin-right: 4px; }
    .my-skills-chip.active { background: #f59e0b; border-color: #f59e0b; color: white; }

    /* Stats */
    .stats-bar { margin-bottom: 20px; font-size: 14px; color: #6b7280; }
    .stats-bar strong { color: #111827; }
    .stats-bar em { color: #4f46e5; font-style: normal; }

    .loading-center { display: flex; justify-content: center; padding: 80px; }

    /* Skills Grid */
    .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    @media (max-width: 480px) { .skills-grid { grid-template-columns: 1fr 1fr; gap: 12px; } }
    @media (max-width: 360px) { .skills-grid { grid-template-columns: 1fr; } }

    .skill-card { background: white; border-radius: 16px; border: 1px solid #e5e7eb; padding: 18px; cursor: pointer; display: flex; flex-direction: column; gap: 10px; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
    .skill-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(79,70,229,0.1); border-color: #c7d2fe; }

    .skill-top { display: flex; align-items: center; justify-content: space-between; }
    .skill-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .tags-wrap { display: flex; align-items: center; gap: 6px; }
    .category-tag { background: #f3f4f6; color: #6b7280; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .popular-tag { background: rgba(245, 158, 11, 0.1); color: #d97706; padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 2px; }
    .popular-tag .material-icons { font-size: 12px; }

    .skill-name { font-size: 15px; font-weight: 700; color: #111827; margin: 0; }
    .skill-desc { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }

    .skill-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
    .popularity { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #9ca3af; }
    .popularity .material-icons { font-size: 14px; }
    .admin-actions { display: flex; gap: 4px; }
    .btn-edit, .btn-delete { width: 28px; height: 28px; border-radius: 7px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-edit { background: #e0e7ff; color: #4f46e5; }
    .btn-edit:hover { background: #c7d2fe; }
    .btn-delete { background: #fee2e2; color: #dc2626; }
    .btn-delete:hover { background: #fecaca; }
    .btn-edit .material-icons, .btn-delete .material-icons { font-size: 14px; }
    
    .action-wrap { display: flex; align-items: center; gap: 8px; }
    .btn-add-skill { display: flex; align-items: center; gap: 4px; border: none; background: #eef2ff; color: #4f46e5; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
    .btn-add-skill .material-icons { font-size: 16px; }
    .btn-add-skill:hover { background: #e0e7ff; }
    .btn-add-skill.added { background: rgba(16, 185, 129, 0.1); color: #059669; }

    /* Empty State */
    .empty-state { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 20px; text-align: center; }
    .empty-icon { width: 72px; height: 72px; border-radius: 20px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
    .empty-icon .material-icons { font-size: 36px; color: #9ca3af; }
    .empty-state h3 { font-size: 18px; font-weight: 700; color: #111827; margin: 0; }
    .empty-state p { font-size: 14px; color: #6b7280; margin: 0; }
    .btn-clear { height: 38px; padding: 0 16px; border-radius: 10px; background: #eef2ff; color: #4f46e5; border: none; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 4px; }

    /* Skill Detail Drawer */
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; justify-content: flex-end; }
    .drawer { width: 100%; max-width: 420px; background: white; height: 100%; padding: 28px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; animation: slideIn 0.25s ease; }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @media (max-width: 480px) { .drawer { max-width: 100%; } }

    .drawer-header { display: flex; align-items: flex-start; gap: 14px; }
    .drawer-icon { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-size: 22px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .drawer-header h2 { font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 4px; }
    .drawer-category { background: #eef2ff; color: #4f46e5; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .drawer-close { margin-left: auto; background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; padding: 4px; border-radius: 8px; flex-shrink: 0; }
    .drawer-close:hover { background: #f3f4f6; color: #374151; }
    .drawer-close .material-icons { font-size: 22px; }
    .drawer-desc { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0; }

    .drawer-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .drawer-stat { background: #f9fafb; border-radius: 12px; padding: 14px; display: flex; align-items: center; gap: 10px; border: 1px solid #e5e7eb; }
    .drawer-stat .material-icons { font-size: 20px; color: #4f46e5; }
    .drawer-stat strong { display: block; font-size: 16px; font-weight: 700; color: #111827; }
    .drawer-stat span { font-size: 12px; color: #6b7280; }

    .drawer-actions { display: flex; flex-direction: column; gap: 10px; margin-top: auto; }
    .btn-find-mentors { height: 48px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(79,70,229,0.3); transition: opacity 0.2s; }
    .btn-find-mentors:hover { opacity: 0.9; }
    .btn-find-mentors .material-icons { font-size: 18px; }
    .btn-find-groups { height: 48px; border-radius: 12px; background: #eef2ff; color: #4f46e5; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s; }
    .btn-find-groups:hover { background: #e0e7ff; }
    .btn-find-groups .material-icons { font-size: 18px; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 16px; }
    .modal-card { background: white; border-radius: 20px; padding: 28px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-header h3 { font-size: 18px; font-weight: 800; color: #111827; margin: 0; }
    .modal-close { background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; padding: 4px; border-radius: 6px; }
    .modal-close:hover { background: #f3f4f6; }
    .modal-close .material-icons { font-size: 20px; }

    .form { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
    .input-group { display: flex; flex-direction: column; gap: 5px; }
    .input-label { font-size: 13px; font-weight: 600; color: #374151; }
    .required { color: #ef4444; }
    .input-wrapper { display: flex; align-items: center; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 0 14px; height: 48px; transition: border-color 0.2s, box-shadow 0.2s; }
    .input-wrapper:focus-within { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); background: white; }
    .textarea-wrap { height: auto; padding: 12px 14px; align-items: flex-start; }
    .input-icon { font-size: 18px; color: #9ca3af; margin-right: 10px; flex-shrink: 0; }
    .input-wrapper.focused .input-icon { color: #4f46e5; }
    .input-wrapper input { flex: 1; border: none; outline: none; font-size: 14px; color: #111827; background: transparent; }
    .input-wrapper textarea { flex: 1; border: none; outline: none; font-size: 14px; color: #111827; background: transparent; resize: none; font-family: inherit; width: 100%; }
    .input-wrapper input::placeholder, .input-wrapper textarea::placeholder { color: #9ca3af; }

    .modal-actions { display: flex; gap: 10px; }
    .btn-modal-cancel { flex: 1; height: 48px; border-radius: 12px; background: #f3f4f6; color: #374151; border: none; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-modal-save { flex: 1; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: opacity 0.2s; }
    .btn-modal-save:hover:not(:disabled) { opacity: 0.9; }
    .btn-modal-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-modal-save .material-icons { font-size: 18px; }
  `]
})
export class SkillListPage implements OnInit {
  private readonly skillService = inject(SkillService);
  private readonly userService = inject(UserService);
  readonly authStore = inject(AuthStore);
  readonly skillStore = inject(SkillStore);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly allSkills = this.skillStore.skills;
  readonly loading = this.skillStore.loading;
  readonly saving = signal(false);
  readonly selectedSkill = signal<SkillDto | null>(null);
  readonly showForm = signal(false);
  readonly editingSkill = signal<SkillDto | null>(null);
  readonly selectedCategory = signal('');
  readonly showMySkills = signal(false);
  readonly categories = signal<string[]>([]);
  readonly selectedSkills = signal<string[]>([]);

  searchQuery = '';
  formData: CreateSkillRequest = { skillName: '', description: '', category: '' };

  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.skillStore.loadAll(undefined);
    this.searchSubject.pipe(debounceTime(350), distinctUntilChanged()).subscribe(q => {
      if (q.length >= 2) {
        this.skillService.search(q).subscribe({
          next: (r) => { /* local filter only, don't update store */ },
          error: () => {}
        });
      } else if (!q) {
        this.skillStore.loadAll(undefined);
      }
    });

    this.userService.getMyProfile().subscribe({
      next: (res: any) => {
        const str = res.data.skills;
        if (str) {
          this.selectedSkills.set(str.split(',').map((s: string) => s.trim()));
        }
      }
    });
  }

  loadAll(): void { this.skillStore.loadAll(undefined); }

  filteredSkills(): SkillDto[] {
    let list = this.skillStore.skills();
    if (this.showMySkills()) {
      list = list.filter(ss => !!ss.skillName && this.selectedSkills().includes(ss.skillName));
    } else if (this.selectedCategory()) {
      list = list.filter(s => s.category === this.selectedCategory());
    }
    
    if (this.searchQuery.trim().length >= 2) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(s => !!s.skillName && s.skillName.toLowerCase().includes(q) || (s.category && s.category.toLowerCase().includes(q)));
    }
    return list;
  }

  onSearch(q: string): void {
    this.searchSubject.next(q);
    // Also update categories from current store
    const cats = [...new Set(this.skillStore.skills().map(s => s.category).filter(Boolean) as string[])].sort();
    this.categories.set(cats);
  }

  filterByCategory(cat: string, mySkills: boolean = false): void {
    this.showMySkills.set(mySkills);
    this.selectedCategory.set(cat);
    // Categories act as local filter 
  }

  clearSearch(): void { this.searchQuery = ''; }
  clearAll(): void { this.searchQuery = ''; this.selectedCategory.set(''); this.showMySkills.set(false); }

  isSkillSelected(name: string): boolean {
    return this.selectedSkills().includes(name);
  }

  toggleProfileSkill(name: string): void {
    const list = this.selectedSkills();
    let updated: string[];
    let actionStr = '';
    
    if (list.includes(name)) {
      updated = list.filter(n => n !== name);
      actionStr = 'Removed from';
    } else {
      updated = [...list, name];
      actionStr = 'Added to';
    }
    
    this.selectedSkills.set(updated);
    
    // Fire and forget auto-save to user profile
    this.userService.updateProfile({ skills: updated.join(',') }).subscribe({
      next: () => {
         this.snack.open(`${actionStr} your profile 🎉`, 'OK', { duration: 2500 });
      }
    });
  }

  selectSkill(skill: SkillDto): void { this.selectedSkill.set(skill); }

  findMentors(skillName: string): void {
    this.selectedSkill.set(null);
    this.router.navigate(['/mentors'], { queryParams: { skill: skillName } });
  }

  findGroups(skillId: number): void {
    this.selectedSkill.set(null);
    this.router.navigate(['/groups'], { queryParams: { skillId } });
  }

  openCreate(): void {
    this.editingSkill.set(null);
    this.formData = { skillName: '', description: '', category: '' };
    this.showForm.set(true);
  }

  openEdit(skill: SkillDto): void {
    this.editingSkill.set(skill);
    this.formData = { skillName: skill.skillName, description: skill.description ?? '', category: skill.category ?? '' };
    this.showForm.set(true);
  }

  saveSkill(): void {
    if (!this.formData.skillName) return;
    this.saving.set(true);
    const obs = this.editingSkill()
      ? this.skillService.update(this.editingSkill()!.id, this.formData)
      : this.skillService.create(this.formData);

    obs.subscribe({
      next: (r) => {
        // Update shared store — apply-mentor page will reflect immediately
        if (this.editingSkill()) {
          this.skillStore.updateSkill(r.data);
          this.snack.open('Skill updated!', 'OK', { duration: 3000 });
        } else {
          this.skillStore.addSkill(r.data);
          this.snack.open('Skill created! It is now available in the mentor application form.', 'OK', { duration: 4000 });
        }
        // Refresh categories
        const cats = [...new Set(this.skillStore.skills().map(s => s.category).filter(Boolean) as string[])].sort();
        this.categories.set(cats);
        this.saving.set(false);
        this.showForm.set(false);
      },
      error: (e) => { this.saving.set(false); this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 }); }
    });
  }

  deleteSkill(id: number): void {
    this.skillService.delete(id).subscribe({
      next: () => { this.skillStore.removeSkill(id); this.snack.open('Skill deleted.', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 })
    });
  }
}
