import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SkillService } from '../../../../core/services/skill.service';
import { SkillStore } from '../../../../core/auth/skill.store';
import { SkillDto, CreateSkillRequest } from '../../../../shared/models/skill.models';

@Component({
  selector: 'app-skills-management-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Skills Management</h1>
          <p>Create, edit and manage all platform skills</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <span class="material-icons">add</span>
          Add Skill
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-num">{{ skillStore.skills().length }}</span>
          <span class="stat-lbl">Total Skills</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ categoryCount() }}</span>
          <span class="stat-lbl">Categories</span>
        </div>
      </div>

      <!-- Create / Edit Form -->
      @if (showForm()) {
        <div class="form-card">
          <div class="form-header">
            <h3>{{ editingId() ? 'Edit Skill' : 'New Skill' }}</h3>
            <button class="btn-icon-close" (click)="closeForm()">
              <span class="material-icons">close</span>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="saveSkill()" class="form-grid">
            <div class="field">
              <label class="label">Skill Name <span class="req">*</span></label>
              <div class="input-box" [class.error]="isInvalid('skillName')">
                <input formControlName="skillName" placeholder="e.g. Java, React, AWS" />
              </div>
              @if (isInvalid('skillName')) { <p class="err">Skill name is required</p> }
            </div>

            <div class="field">
              <label class="label">Category <span class="req">*</span></label>
              <div class="input-box">
                <input formControlName="category" placeholder="e.g. Backend, Frontend, Cloud" list="cat-list" />
                <datalist id="cat-list">
                  @for (cat of skillStore.groupedByCategory(); track cat.category) {
                    <option [value]="cat.category"></option>
                  }
                </datalist>
              </div>
            </div>

            <div class="field full-span">
              <label class="label">Description</label>
              <div class="input-box textarea-box">
                <textarea formControlName="description" placeholder="Optional description..." rows="3"></textarea>
              </div>
            </div>

            <div class="form-actions full-span">
              <button type="button" class="btn-cancel" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn-save" [disabled]="saving()">
                @if (saving()) { <mat-spinner diameter="18" /> }
                @else { <span class="material-icons">save</span> }
                {{ editingId() ? 'Update Skill' : 'Create Skill' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Loading -->
      @if (skillStore.loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      }

      <!-- Error -->
      @if (skillStore.error()) {
        <div class="error-banner">
          <span class="material-icons">error_outline</span>
          {{ skillStore.error() }}
        </div>
      }

      <!-- Skills Table by Category -->
      @if (!skillStore.loading()) {
        @for (cat of skillStore.groupedByCategory(); track cat.category) {
          <div class="category-section">
            <div class="cat-header">
              <span class="cat-badge">{{ cat.category }}</span>
              <span class="cat-count">{{ cat.skills.length }} skills</span>
            </div>
            <div class="skills-grid">
              @for (skill of cat.skills; track skill.id) {
                <div class="skill-card">
                  <div class="skill-info">
                    <span class="skill-name">{{ skill.name }}</span>
                    <span class="skill-id">#{{ skill.id }}</span>
                  </div>
                  <div class="skill-actions">
                    <button class="btn-edit" (click)="startEdit(skill.id)" title="Edit">
                      <span class="material-icons">edit</span>
                    </button>
                    <button class="btn-delete" (click)="deleteSkill(skill.id)" title="Delete">
                      <span class="material-icons">delete</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        @if (skillStore.skills().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><span class="material-icons">auto_stories</span></div>
            <h3>No skills yet</h3>
            <p>Create the first skill to get started</p>
            <button class="btn-primary" (click)="openCreate()">
              <span class="material-icons">add</span> Add First Skill
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; padding-bottom: 48px; }

    /* Header */
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    }
    .page-header h1 { font-size: 28px; font-weight: 800; color: var(--text); margin: 0 0 4px; }
    .page-header p { color: var(--text-secondary); font-size: 14px; margin: 0; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      height: 44px; padding: 0 20px; border-radius: 12px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: white; border: none; font-size: 14px; font-weight: 600;
      cursor: pointer; box-shadow: var(--shadow-primary); transition: opacity .2s, transform .15s;
    }
    .btn-primary:hover { opacity: .9; transform: translateY(-1px); }
    .btn-primary .material-icons { font-size: 18px; }

    /* Stats */
    .stats-row { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-card {
      flex: 1; background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; padding: 20px; text-align: center; box-shadow: var(--shadow-sm);
    }
    .stat-num { display: block; font-size: 32px; font-weight: 800; color: var(--primary); }
    .stat-lbl { display: block; font-size: 13px; color: var(--text-secondary); margin-top: 4px; }

    /* Form Card */
    .form-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 20px; padding: 28px; margin-bottom: 28px;
      box-shadow: var(--shadow-md); animation: slideIn 0.2s ease-out;
    }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .form-header h3 { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
    .btn-icon-close { background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 4px; border-radius: 6px; transition: background .15s; }
    .btn-icon-close:hover { background: var(--surface-alt); color: var(--text); }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-span { grid-column: 1/-1; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .label { font-size: 13px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 4px; }
    .req { color: var(--error); }

    .input-box {
      display: flex; align-items: center;
      background: var(--surface-alt); border: 1.5px solid var(--border);
      border-radius: 12px; padding: 0 14px; height: 48px;
      transition: border-color .2s, box-shadow .2s;
    }
    .input-box:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-muted);
      background: var(--surface);
    }
    .input-box.error { border-color: var(--error); }
    .textarea-box { height: auto; padding: 12px 14px; align-items: flex-start; }
    .input-box input, .input-box textarea {
      flex: 1; border: none; outline: none;
      font-size: 14px; color: var(--text);
      background: transparent; font-family: inherit; resize: none;
    }
    .input-box input::placeholder, .input-box textarea::placeholder { color: var(--text-muted); }
    .err { font-size: 12px; color: var(--error); margin: 0; }

    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 8px; }
    .btn-cancel {
      height: 44px; padding: 0 24px; border-radius: 12px;
      background: var(--surface-alt); color: var(--text); border: 1px solid var(--border);
      font-size: 14px; font-weight: 600; cursor: pointer; transition: background .15s;
    }
    .btn-cancel:hover { background: var(--border); }
    .btn-save {
      display: inline-flex; align-items: center; gap: 8px;
      height: 44px; padding: 0 28px; border-radius: 12px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: white; border: none; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: opacity .2s;
    }
    .btn-save:disabled { opacity: .6; cursor: not-allowed; }
    .btn-save .material-icons { font-size: 16px; }

    /* Loading / Error */
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .error-banner {
      display: flex; align-items: center; gap: 8px;
      background: var(--error-bg); color: var(--error);
      border: 1px solid var(--error-border);
      padding: 12px 16px; border-radius: 12px; margin-bottom: 16px;
      font-size: 14px;
    }

    /* Categories */
    .category-section { margin-bottom: 28px; }
    .cat-header {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 14px; padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
    }
    .cat-badge {
      background: var(--primary-light); color: var(--primary);
      padding: 4px 14px; border-radius: 20px;
      font-size: 13px; font-weight: 700;
    }
    .cat-count { font-size: 12px; color: var(--text-muted); }

    .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
    .skill-card {
      display: flex; justify-content: space-between; align-items: center;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 12px 14px;
      box-shadow: var(--shadow-sm);
      transition: box-shadow .15s, border-color .15s;
    }
    .skill-card:hover { box-shadow: var(--shadow-md); border-color: var(--primary); }
    .skill-info { display: flex; flex-direction: column; gap: 2px; }
    .skill-name { font-size: 14px; font-weight: 600; color: var(--text); }
    .skill-id { font-size: 11px; color: var(--text-muted); }
    .skill-actions { display: flex; gap: 4px; }
    .btn-edit, .btn-delete {
      width: 32px; height: 32px; border-radius: 8px;
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .btn-edit { background: var(--primary-light); color: var(--primary); }
    .btn-edit:hover { background: var(--primary); color: white; }
    .btn-delete { background: var(--error-bg); color: var(--error); }
    .btn-delete:hover { background: var(--error); color: white; }
    .btn-edit .material-icons, .btn-delete .material-icons { font-size: 16px; }

    /* Empty */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 80px 20px; text-align: center;
    }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 20px;
      background: var(--surface-alt); display: flex; align-items: center; justify-content: center;
    }
    .empty-icon .material-icons { font-size: 36px; color: var(--text-muted); }
    .empty-state h3 { font-size: 20px; font-weight: 700; color: var(--text); margin: 0; }
    .empty-state p { font-size: 14px; color: var(--text-secondary); margin: 0; }

    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .stats-row { flex-direction: column; }
    }
  `]
})
export class SkillsManagementPage implements OnInit {
  private readonly skillService = inject(SkillService);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  readonly skillStore = inject(SkillStore);

  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    skillName:   ['', [Validators.required, Validators.minLength(1)]],
    category:    ['', [Validators.required]],
    description: ['']
  });

  ngOnInit(): void {
    this.skillStore.loadAll(undefined);
  }

  categoryCount(): number {
    return this.skillStore.groupedByCategory().length;
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  startEdit(id: number): void {
    const skill = this.skillStore.getSkillById(id);
    if (!skill) return;
    this.editingId.set(id);
    this.form.patchValue({
      skillName: skill.skillName,
      category: skill.category ?? '',
      description: skill.description ?? ''
    });
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  saveSkill(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const val = this.form.getRawValue();
    const req: CreateSkillRequest = {
      skillName:   val.skillName!.trim(),
      category:    val.category!.trim(),
      description: val.description?.trim() || undefined
    };

    this.saving.set(true);
    const id = this.editingId();

    const call$ = id
      ? this.skillService.update(id, req)
      : this.skillService.create(req);

    call$.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (id) {
          this.skillStore.updateSkill(res.data);
        } else {
          this.skillStore.addSkill(res.data);
        }
        this.snack.open(
          id ? 'Skill updated successfully' : 'Skill created successfully',
          'OK', { duration: 3000, panelClass: ['snack-success'] }
        );
        this.closeForm();
      },
      error: (e) => {
        this.saving.set(false);
        this.snack.open(e?.error?.message ?? 'Failed to save skill', 'Dismiss', { duration: 4000 });
      }
    });
  }

  deleteSkill(id: number): void {
    if (!confirm('Delete this skill? This action cannot be undone.')) return;
    this.skillService.delete(id).subscribe({
      next: () => {
        this.skillStore.removeSkill(id);
        this.snack.open('Skill deleted', 'OK', { duration: 3000 });
      },
      error: (e) => {
        this.snack.open(e?.error?.message ?? 'Failed to delete skill', 'Dismiss', { duration: 4000 });
      }
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }
}
