import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { SkillService } from '../../../../core/services/skill.service';
import { SkillDto, CreateSkillRequest } from '../../../../shared/models/skill.models';
import { FormsModule } from '@angular/forms';

type AdminTab = 'mentors' | 'skills';

@Component({
  selector: 'app-pending-mentors-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Admin Panel</h1>
          <p>Manage mentor applications and skills</p>
        </div>
        <div class="header-stats">
          <div class="stat-pill">
            <span class="material-icons">pending_actions</span>
            {{ mentorStore.pendingCount() }} pending
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="admin-tabs">
        <button class="admin-tab" [class.active]="tab() === 'mentors'" (click)="tab.set('mentors')">
          <span class="material-icons">how_to_reg</span>
          Mentor Applications
          @if (mentorStore.pendingCount() > 0) {
            <span class="tab-badge">{{ mentorStore.pendingCount() }}</span>
          }
        </button>
        <button class="admin-tab" [class.active]="tab() === 'skills'" (click)="tab.set('skills'); loadSkills()">
          <span class="material-icons">auto_stories</span>
          Skills Management
        </button>
      </div>

      <!-- ── Mentor Applications Tab ── -->
      @if (tab() === 'mentors') {
        @if (mentorStore.loading()) {
          <div class="loading-center"><mat-spinner diameter="48" /></div>
        } @else {
          <div class="grid">
            @for (m of mentorStore.pending(); track m.id) {
              <div class="app-card">
                <div class="card-header">
                  <div class="avatar">{{ m.specialization[0].toUpperCase() }}</div>
                  <div class="card-info">
                    <h3>{{ m.specialization }}</h3>
                    <p>User #{{ m.userId }}</p>
                  </div>
                  <div class="pending-chip">Pending</div>
                </div>
                <div class="card-details">
                  <div class="detail-item">
                    <span class="material-icons">workspace_premium</span>
                    {{ m.yearsOfExperience }} yrs experience
                  </div>
                  <div class="detail-item">
                    <span class="material-icons">payments</span>
                    ₹{{ m.hourlyRate }}/hr
                  </div>
                  <div class="detail-item">
                    <span class="material-icons">calendar_today</span>
                    Applied {{ m.createdAt | date:'mediumDate' }}
                  </div>
                </div>
                <div class="card-actions">
                  <button class="btn-approve" (click)="approve(m.id)">
                    <span class="material-icons">check_circle</span> Approve
                  </button>
                  <button class="btn-reject" (click)="reject(m.id)">
                    <span class="material-icons">cancel</span> Reject
                  </button>
                </div>
              </div>
            }
            @empty {
              <div class="empty-state">
                <div class="empty-icon"><span class="material-icons">how_to_reg</span></div>
                <h3>No pending applications</h3>
                <p>All applications have been reviewed.</p>
              </div>
            }
          </div>
        }
      }

      <!-- ── Skills Management Tab ── -->
      @if (tab() === 'skills') {
        <div class="skills-header">
          <div class="search-bar">
            <span class="material-icons">search</span>
            <input [(ngModel)]="skillSearch" placeholder="Search skills..." class="search-input" />
          </div>
          <button class="btn-add-skill" (click)="openCreate()">
            <span class="material-icons">add</span> Add Skill
          </button>
        </div>

        @if (skillsLoading()) {
          <div class="loading-center"><mat-spinner diameter="48" /></div>
        } @else {
          <div class="skills-table">
            <div class="table-header">
              <span>Skill</span>
              <span>Category</span>
              <span>Popularity</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            @for (s of filteredSkills(); track s.id) {
              <div class="table-row">
                <div class="skill-cell">
                  <div class="skill-dot">{{ s.skillName[0].toUpperCase() }}</div>
                  <div>
                    <strong>{{ s.skillName }}</strong>
                    @if (s.description) {
                      <p>{{ s.description | slice:0:50 }}{{ s.description.length > 50 ? '...' : '' }}</p>
                    }
                  </div>
                </div>
                <span class="category-tag">{{ s.category || '—' }}</span>
                <span class="popularity-val">{{ s.popularityScore }}</span>
                <span class="status-badge" [class.active]="s.isActive" [class.inactive]="!s.isActive">
                  {{ s.isActive ? 'Active' : 'Inactive' }}
                </span>
                <div class="row-actions">
                  <button class="btn-edit" (click)="openEdit(s)">
                    <span class="material-icons">edit</span>
                  </button>
                  <button class="btn-delete" (click)="deleteSkill(s.id)">
                    <span class="material-icons">delete</span>
                  </button>
                </div>
              </div>
            }
            @empty {
              <div class="empty-state" style="grid-column:1/-1">
                <div class="empty-icon"><span class="material-icons">auto_stories</span></div>
                <h3>No skills found</h3>
                <p>Add your first skill to get started.</p>
              </div>
            }
          </div>
        }
      }

      <!-- Create / Edit Skill Modal -->
      @if (showSkillForm()) {
        <div class="modal-overlay" (click)="showSkillForm.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingSkill() ? 'Edit Skill' : 'Add New Skill' }}</h3>
              <button class="modal-close" (click)="showSkillForm.set(false)">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="form">
              <div class="input-group">
                <label class="input-label">Skill Name <span class="required">*</span></label>
                <div class="input-wrapper">
                  <span class="material-icons input-icon">auto_stories</span>
                  <input type="text" [(ngModel)]="skillForm.skillName" placeholder="e.g. Java, React, AWS" />
                </div>
              </div>
              <div class="input-group">
                <label class="input-label">Category</label>
                <div class="input-wrapper">
                  <span class="material-icons input-icon">category</span>
                  <input type="text" [(ngModel)]="skillForm.category" placeholder="e.g. Programming, Design" />
                </div>
              </div>
              <div class="input-group">
                <label class="input-label">Description</label>
                <div class="input-wrapper textarea-wrap">
                  <textarea [(ngModel)]="skillForm.description" placeholder="Brief description..." rows="3"></textarea>
                </div>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-modal-cancel" (click)="showSkillForm.set(false)">Cancel</button>
              <button class="btn-modal-save" (click)="saveSkill()" [disabled]="!skillForm.skillName || skillSaving()">
                @if (skillSaving()) { <mat-spinner diameter="18" /> }
                @else {
                  <span class="material-icons">{{ editingSkill() ? 'save' : 'add' }}</span>
                  {{ editingSkill() ? 'Update' : 'Create' }}
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

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .page-header h1 { font-size: 28px; font-weight: 800; color: #111827; margin: 0 0 4px; }
    :host-context(.dark) .page-header h1 { color: #f3f4f6; }
    .page-header p { color: #6b7280; font-size: 14px; margin: 0; }
    :host-context(.dark) .page-header p { color: #d1d5db; }
    .stat-pill { display: flex; align-items: center; gap: 6px; background: #fef3c7; color: #d97706; padding: 8px 16px; border-radius: 12px; font-size: 14px; font-weight: 600; }
    .stat-pill .material-icons { font-size: 18px; }

    /* Tabs */
    .admin-tabs { display: flex; gap: 4px; background: #f3f4f6; border-radius: 14px; padding: 4px; margin-bottom: 24px; width: fit-content; }
    .admin-tab { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 18px; border-radius: 10px; border: none; background: none; color: #6b7280; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .admin-tab:hover { color: #111827; }
    .admin-tab.active { background: white; color: #4f46e5; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .admin-tab .material-icons { font-size: 18px; }
    .tab-badge { background: #ef4444; color: white; font-size: 11px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; padding: 0 4px; display: flex; align-items: center; justify-content: center; }

    /* Mentor grid */
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .app-card { background: white; border-radius: 16px; border: 1px solid #e5e7eb; padding: 20px; display: flex; flex-direction: column; gap: 16px; transition: box-shadow 0.2s; }
    .app-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .card-header { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-size: 20px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .card-info { flex: 1; }
    .card-info h3 { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 2px; }
    .card-info p { font-size: 12px; color: #9ca3af; margin: 0; }
    .pending-chip { background: #fef3c7; color: #d97706; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .card-details { display: flex; flex-direction: column; gap: 8px; }
    .detail-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6b7280; }
    .detail-item .material-icons { font-size: 16px; color: #9ca3af; }
    .card-actions { display: flex; gap: 8px; }
    .btn-approve { flex: 1; height: 40px; border-radius: 10px; background: #dcfce7; color: #16a34a; border: none; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.15s; }
    .btn-approve:hover { background: #bbf7d0; }
    .btn-approve .material-icons { font-size: 16px; }
    .btn-reject { flex: 1; height: 40px; border-radius: 10px; background: #fee2e2; color: #dc2626; border: none; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.15s; }
    .btn-reject:hover { background: #fecaca; }
    .btn-reject .material-icons { font-size: 16px; }

    /* Skills tab */
    .skills-header { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .search-bar { flex: 1; min-width: 200px; display: flex; align-items: center; gap: 10px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 0 14px; height: 48px; }
    .search-bar .material-icons { color: #9ca3af; font-size: 20px; }
    .search-input { flex: 1; border: none; outline: none; font-size: 14px; color: #111827; background: transparent; }
    .search-input::placeholder { color: #9ca3af; }
    .btn-add-skill { display: flex; align-items: center; gap: 6px; height: 48px; padding: 0 20px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; box-shadow: 0 4px 12px rgba(79,70,229,0.3); }
    .btn-add-skill .material-icons { font-size: 18px; }

    /* Skills table */
    .skills-table { background: white; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 100px; gap: 12px; padding: 12px 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 100px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid #f3f4f6; align-items: center; transition: background 0.15s; }
    .table-row:last-child { border-bottom: none; }
    .table-row:hover { background: #f9fafb; }
    @media (max-width: 768px) {
      .table-header { display: none; }
      .table-row { grid-template-columns: 1fr; gap: 8px; }
    }
    .skill-cell { display: flex; align-items: center; gap: 12px; }
    .skill-dot { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .skill-cell strong { display: block; font-size: 14px; font-weight: 600; color: #111827; }
    .skill-cell p { font-size: 12px; color: #9ca3af; margin: 2px 0 0; }
    .category-tag { background: #f3f4f6; color: #6b7280; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; width: fit-content; }
    .popularity-val { font-size: 14px; font-weight: 600; color: #374151; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; width: fit-content; }
    .status-badge.active { background: #dcfce7; color: #16a34a; }
    .status-badge.inactive { background: #fee2e2; color: #dc2626; }
    .row-actions { display: flex; gap: 6px; }
    .btn-edit { width: 32px; height: 32px; border-radius: 8px; background: #e0e7ff; color: #4f46e5; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-edit:hover { background: #c7d2fe; }
    .btn-delete { width: 32px; height: 32px; border-radius: 8px; background: #fee2e2; color: #dc2626; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-delete:hover { background: #fecaca; }
    .btn-edit .material-icons, .btn-delete .material-icons { font-size: 15px; }

    /* Empty / Loading */
    .loading-center { display: flex; justify-content: center; padding: 80px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; }
    .empty-icon { width: 72px; height: 72px; border-radius: 20px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
    .empty-icon .material-icons { font-size: 36px; color: #9ca3af; }
    .empty-state h3 { font-size: 18px; font-weight: 700; color: #111827; margin: 0; }
    .empty-state p { color: #6b7280; font-size: 14px; margin: 0; }

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
    .input-wrapper { display: flex; align-items: center; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 0 14px; height: 48px; transition: border-color 0.2s; }
    .input-wrapper:focus-within { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); background: white; }
    .textarea-wrap { height: auto; padding: 12px 14px; align-items: flex-start; }
    .input-icon { font-size: 18px; color: #9ca3af; margin-right: 10px; }
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
export class PendingMentorsPage implements OnInit {
  readonly mentorStore = inject(MentorStore);
  private readonly skillService = inject(SkillService);
  private readonly snack = inject(MatSnackBar);

  readonly tab = signal<AdminTab>('mentors');
  readonly skills = signal<SkillDto[]>([]);
  readonly skillsLoading = signal(false);
  readonly showSkillForm = signal(false);
  readonly editingSkill = signal<SkillDto | null>(null);
  readonly skillSaving = signal(false);

  skillSearch = '';
  skillForm: CreateSkillRequest = { skillName: '', description: '', category: '' };

  ngOnInit(): void { this.mentorStore.loadPending(undefined); }

  loadSkills(): void {
    if (this.skills().length) return;
    this.skillsLoading.set(true);
    this.skillService.getAll().subscribe({
      next: (r) => { this.skills.set(r.data ?? []); this.skillsLoading.set(false); },
      error: () => this.skillsLoading.set(false)
    });
  }

  filteredSkills(): SkillDto[] {
    const q = this.skillSearch.toLowerCase();
    return q ? this.skills().filter(s => s.skillName.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)) : this.skills();
  }

  approve(id: number): void { this.mentorStore.approve(id); this.snack.open('Mentor approved!', 'OK', { duration: 3000 }); }
  reject(id: number): void { this.mentorStore.reject(id); this.snack.open('Application rejected.', 'OK', { duration: 3000 }); }

  openCreate(): void {
    this.editingSkill.set(null);
    this.skillForm = { skillName: '', description: '', category: '' };
    this.showSkillForm.set(true);
  }

  openEdit(s: SkillDto): void {
    this.editingSkill.set(s);
    this.skillForm = { skillName: s.skillName, description: s.description ?? '', category: s.category ?? '' };
    this.showSkillForm.set(true);
  }

  saveSkill(): void {
    if (!this.skillForm.skillName) return;
    this.skillSaving.set(true);
    const obs = this.editingSkill()
      ? this.skillService.update(this.editingSkill()!.id, this.skillForm)
      : this.skillService.create(this.skillForm);
    obs.subscribe({
      next: (r) => {
        if (this.editingSkill()) {
          this.skills.update(list => list.map(s => s.id === r.data.id ? r.data : s));
          this.snack.open('Skill updated!', 'OK', { duration: 3000 });
        } else {
          this.skills.update(list => [r.data, ...list]);
          this.snack.open('Skill created!', 'OK', { duration: 3000 });
        }
        this.skillSaving.set(false);
        this.showSkillForm.set(false);
      },
      error: (e) => { this.skillSaving.set(false); this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 }); }
    });
  }

  deleteSkill(id: number): void {
    this.skillService.delete(id).subscribe({
      next: () => { this.skills.update(list => list.filter(s => s.id !== id)); this.snack.open('Skill deleted.', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 })
    });
  }
}
