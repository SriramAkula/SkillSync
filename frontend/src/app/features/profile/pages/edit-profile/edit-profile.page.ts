import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { UserProfileDto } from '../../../../shared/models';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="page-header">
        <button class="btn-back" (click)="goBack()">
          <span class="material-icons">arrow_back</span>
          Back to Profile
        </button>
        <div class="header-text">
          <h1>Edit Profile</h1>
          <p>Update your personal information</p>
        </div>
      </div>

      <!-- ── Loading ── -->
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="48" />
          <p class="loading-text">Loading your profile...</p>
        </div>
      }

      <!-- ── Edit Form (shown only on this page) ── -->
      @if (!loading()) {
        <div class="form-card">

          <form [formGroup]="form" (ngSubmit)="save()" novalidate>

            <!-- Section: Basic Info -->
            <div class="section-title">Basic Information</div>

            <!-- First Name + Last Name -->
            <div class="row-2col">
              <div class="field">
                <label class="label">
                  First Name <span class="req">*</span>
                </label>
                <div class="input-box" [class.error]="isInvalid('firstName')">
                  <span class="material-icons icon">person</span>
                  <input formControlName="firstName"
                         type="text"
                         placeholder="Enter first name"
                         autocomplete="given-name" />
                </div>
                @if (isInvalid('firstName')) {
                  <p class="err">First name is required</p>
                }
              </div>

              <div class="field">
                <label class="label">Last Name</label>
                <div class="input-box">
                  <span class="material-icons icon">person_outline</span>
                  <input formControlName="lastName"
                         type="text"
                         placeholder="Enter last name"
                         autocomplete="family-name" />
                </div>
              </div>
            </div>

            <!-- Username -->
            <div class="field">
              <label class="label">
                Username <span class="req">*</span>
              </label>
              <div class="input-box" [class.error]="isInvalid('username')">
                <span class="material-icons icon">alternate_email</span>
                <input formControlName="username"
                       type="text"
                       placeholder="Enter username"
                       autocomplete="username" />
              </div>
              @if (isInvalid('username')) {
                <p class="err">Username is required</p>
              }
            </div>

            <!-- Email (read-only) -->
            <div class="field">
              <label class="label">
                Email
                <span class="readonly-badge">read-only</span>
              </label>
              <div class="input-box readonly">
                <span class="material-icons icon">email</span>
                <input formControlName="email"
                       type="email"
                       readonly
                       tabindex="-1" />
              </div>
            </div>

            <!-- Phone -->
            <div class="field">
              <label class="label">Phone Number <span class="req">*</span></label>
              <div class="input-box" [class.error]="isInvalid('phoneNumber')">
                <span class="material-icons icon">phone</span>
                <input formControlName="phoneNumber"
                       type="text"
                       maxlength="10"
                       placeholder="e.g. 9876543210"
                       autocomplete="tel" />
              </div>
              @if (isInvalid('phoneNumber')) {
                <div class="err-list">
                  @if (form.get('phoneNumber')?.hasError('required')) { <p class="err">Phone number is required</p> }
                  @if (form.get('phoneNumber')?.hasError('pattern')) { <p class="err">Only numbers are allowed</p> }
                  @if (form.get('phoneNumber')?.hasError('minlength') || form.get('phoneNumber')?.hasError('maxlength')) { 
                    <p class="err">Phone number must be exactly 10 digits</p> 
                  }
                </div>
              }
            </div>

            <!-- Section: About -->
            <div class="section-title" style="margin-top: 8px;">About You</div>

            <!-- Bio -->
            <div class="field">
              <label class="label">Bio</label>
              <div class="input-box textarea-box">
                <textarea formControlName="bio"
                          placeholder="Add bio — tell others about yourself..."
                          rows="4"></textarea>
              </div>
              <p class="hint">Max 500 characters</p>
            </div>

            <!-- Skills -->
            <div class="field">
              <label class="label">Skills</label>

              <!-- Selected skill chips -->
              @if (selectedSkills().length > 0) {
                <div class="chips-wrap">
                  @for (s of selectedSkills(); track s) {
                    <span class="chip">
                      {{ s }}
                      <button type="button" class="chip-x" (click)="removeSkill(s)"
                              [attr.aria-label]="'Remove ' + s">
                        <span class="material-icons">close</span>
                      </button>
                    </span>
                  }
                </div>
              }

              <!-- Skill dropdown -->
              <div class="input-box">
                <span class="material-icons icon">auto_stories</span>
                <select class="select" (change)="addSkill($event)">
                  <option value="" disabled selected>Select Skills</option>
                  @for (cat of skillStore.groupedByCategory(); track cat.category) {
                    <optgroup [label]="cat.category">
                      @for (s of cat.skills; track s.id) {
                        <option [value]="s.name"
                                [disabled]="selectedSkills().includes(s.name)">
                          {{ s.name }}
                        </option>
                      }
                    </optgroup>
                  }
                </select>
              </div>

              @if (selectedSkills().length > 0) {
                <p class="hint">
                  {{ selectedSkills().length }} skill{{ selectedSkills().length !== 1 ? 's' : '' }} selected
                </p>
              }
            </div>

            <!-- ── Actions ── -->
            <div class="actions">
              <button type="button" class="btn-cancel" (click)="goBack()">
                Cancel
              </button>
              <button type="submit" class="btn-save" [disabled]="saving()">
                @if (saving()) {
                  <mat-spinner diameter="18" />
                } @else {
                  <span class="material-icons">save</span>
                }
                Save Changes
              </button>
            </div>

          </form>
        </div>
      }

    </div>
  `,
  styles: [`
    /* ── Page ── */
    .page { max-width: 700px; margin: 0 auto; padding-bottom: 48px; }

    /* ── Header ── */
    .page-header { margin-bottom: 28px; }
    .btn-back {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none; color: #4f46e5;
      font-size: 13px; font-weight: 600; cursor: pointer; padding: 0;
      margin-bottom: 16px; transition: color .15s;
    }
    .btn-back:hover { color: #4338ca; }
    .btn-back .material-icons { font-size: 18px; }
    .header-text h1 {
      font-size: 26px; font-weight: 800; color: #111827;
      margin: 0 0 4px; letter-spacing: -.4px;
    }
    .header-text p { font-size: 14px; color: #6b7280; margin: 0; }

    /* ── Loading ── */
    .loading-center {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 80px; gap: 16px;
    }
    .loading-text { font-size: 14px; color: #6b7280; margin: 0; }

    /* ── Form Card ── */
    .form-card {
      background: #fff; border-radius: 20px;
      border: 1px solid #e5e7eb; padding: 36px;
      box-shadow: 0 1px 4px rgba(0,0,0,.07);
    }

    /* ── Section Title ── */
    .section-title {
      font-size: 12px; font-weight: 700; color: #9ca3af;
      text-transform: uppercase; letter-spacing: 1px;
      margin-bottom: 16px; padding-bottom: 8px;
      border-bottom: 1px solid #f3f4f6;
    }

    /* ── Field ── */
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .field:last-of-type { margin-bottom: 0; }

    .row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 520px) { .row-2col { grid-template-columns: 1fr; } }

    .label {
      font-size: 13px; font-weight: 600; color: #374151;
      display: flex; align-items: center; gap: 6px;
    }
    .req { color: #ef4444; font-size: 14px; }
    .readonly-badge {
      font-size: 10px; font-weight: 500; color: #9ca3af;
      background: #f3f4f6; padding: 2px 7px; border-radius: 4px;
      letter-spacing: .3px;
    }

    /* ── Input Box ── */
    .input-box {
      display: flex; align-items: center;
      background: #f9fafb; border: 1.5px solid #e5e7eb;
      border-radius: 12px; padding: 0 14px; height: 50px;
      transition: border-color .2s, box-shadow .2s, background .2s;
    }
    .input-box:focus-within {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79,70,229,.12);
      background: #fff;
    }
    .input-box.error { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
    .input-box.readonly { background: #f3f4f6; pointer-events: none; }
    .input-box.readonly input { color: #6b7280; }
    .textarea-box { height: auto; padding: 12px 14px; align-items: flex-start; }

    .icon { font-size: 18px; color: #9ca3af; margin-right: 10px; flex-shrink: 0; }

    .input-box input,
    .input-box textarea {
      flex: 1; border: none; outline: none;
      font-size: 14px; color: #111827;
      background: transparent; font-family: inherit; resize: none;
    }
    .input-box input::placeholder,
    .input-box textarea::placeholder { color: #9ca3af; }

    .select {
      flex: 1; border: none; outline: none;
      font-size: 14px; color: #111827;
      background: transparent; font-family: inherit; cursor: pointer;
    }

    .err  { font-size: 12px; color: #ef4444; margin: 0; }
    .hint { font-size: 12px; color: #9ca3af; margin: 0; }

    /* ── Skill Chips ── */
    .chips-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
    .chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: #4f46e5; color: #fff;
      padding: 5px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
    }
    .chip-x {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,.7); display: flex; align-items: center; padding: 0;
      transition: color .15s;
    }
    .chip-x:hover { color: #fff; }
    .chip-x .material-icons { font-size: 14px; }

    /* ── Actions ── */
    .actions {
      display: flex; justify-content: flex-end; gap: 12px;
      margin-top: 32px; padding-top: 24px;
      border-top: 1px solid #f3f4f6;
    }

    .btn-cancel {
      height: 48px; padding: 0 28px; border-radius: 12px;
      background: #f3f4f6; color: #374151; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: background .15s;
    }
    .btn-cancel:hover { background: #e5e7eb; }

    .btn-save {
      display: inline-flex; align-items: center; gap: 8px;
      height: 48px; padding: 0 36px; border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff; border: none; font-size: 15px; font-weight: 700;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(79,70,229,.35);
      transition: transform .2s, box-shadow .2s, opacity .2s;
    }
    .btn-save:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(79,70,229,.45);
    }
    .btn-save:active:not(:disabled) { transform: translateY(0); }
    .btn-save:disabled { opacity: .55; cursor: not-allowed; transform: none; }
    .btn-save .material-icons { font-size: 18px; }

    @media (max-width: 500px) {
      .form-card { padding: 24px 18px; }
      .actions { flex-direction: column-reverse; }
      .btn-cancel, .btn-save { width: 100%; justify-content: center; }
    }
  `]
})
export class EditProfilePage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router      = inject(Router);
  private readonly snack       = inject(MatSnackBar);
  private readonly fb          = inject(FormBuilder);
  readonly skillStore           = inject(SkillStore);
  private readonly authStore    = inject(AuthStore);

  readonly loading        = signal(true);
  readonly saving         = signal(false);
  readonly selectedSkills = signal<string[]>([]);

  readonly form = this.fb.group({
    firstName:   ['', [Validators.required, Validators.minLength(1)]],
    lastName:    [''],
    username:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email:       [{ value: '', disabled: true }],
    phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.minLength(10), Validators.maxLength(10)]],
    bio:         ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    // Load skills list for the dropdown
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }

    // Always fetch fresh data from the server — never use stale state
    this.userService.getMyProfile().subscribe({
      next:  res => { this.prefill(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  private prefill(p: UserProfileDto): void {
    const parts  = (p.name || '').trim().split(' ').filter(Boolean);
    const skills = p.skills
      ? p.skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    this.form.patchValue({
      firstName:   parts[0]                    || '',
      lastName:    parts.slice(1).join(' ')    || '',
      username:    p.username                  || this.authStore.username() || '',
      email:       p.email                     || this.authStore.email() || '',
      phoneNumber: p.phoneNumber               || '',
      bio:         p.bio                       || ''
    });

    this.selectedSkills.set(skills);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  addSkill(event: Event): void {
    const sel   = event.target as HTMLSelectElement;
    const skill = sel.value;
    if (skill && !this.selectedSkills().includes(skill)) {
      this.selectedSkills.update(list => [...list, skill]);
    }
    sel.value = '';
  }

  removeSkill(skill: string): void {
    this.selectedSkills.update(list => list.filter(s => s !== skill));
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    // Always construct Name from FirstName + LastName as per backend's requirement
    const val  = this.form.getRawValue();
    const name = `${val.firstName ?? ''} ${val.lastName ?? ''}`.trim();

    this.saving.set(true);

    this.userService.updateProfile({
      username:    val.username?.trim(),
      name,
      bio:         val.bio?.trim()         || undefined,
      phoneNumber: val.phoneNumber?.trim() || undefined,
      // Map skills to comma-separated string for backend
      skills:      this.selectedSkills().join(',') || undefined
    }).subscribe({
      next: () => {
        this.saving.set(false);

        // ── Mandatory success message ──
        this.snack.open('Profile changed successfully', 'OK', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['snack-success']
        });

        // ── Navigate to profile — profile page will re-fetch from DB ──
        this.router.navigate(['/profile']);
      },
      error: (e) => {
        this.saving.set(false);
        const msg =
          e?.error?.message ??
          e?.error?.errors?.[0]?.defaultMessage ??
          'Failed to update profile. Please try again.';
        this.snack.open(msg, 'Dismiss', { duration: 5000 });
      }
    });
  }

  goBack(): void { this.router.navigate(['/profile']); }
}
