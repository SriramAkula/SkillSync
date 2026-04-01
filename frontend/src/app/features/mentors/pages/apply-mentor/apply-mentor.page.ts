import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { SkillStore } from '../../../../core/auth/skill.store';

// Fallback categories shown while skills load from backend
const FALLBACK_CATEGORIES = [
  { category: 'Programming',      skills: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Kotlin', 'Swift'] },
  { category: 'Web & Frontend',   skills: ['React', 'Angular', 'Vue.js', 'Next.js', 'HTML/CSS', 'Tailwind CSS', 'Node.js', 'Express.js'] },
  { category: 'Data & AI',        skills: ['Machine Learning', 'Deep Learning', 'Data Science', 'TensorFlow', 'PyTorch', 'SQL', 'Power BI', 'Tableau'] },
  { category: 'Cloud & DevOps',   skills: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux'] },
  { category: 'Mobile',           skills: ['Android', 'iOS', 'React Native', 'Flutter'] },
  { category: 'Design & Product', skills: ['UI/UX Design', 'Figma', 'Product Management', 'Agile/Scrum'] },
];

@Component({
  selector: 'app-apply-mentor-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">
      <button class="back-btn" (click)="router.navigate(['/mentors'])">
        <span class="material-icons">arrow_back</span> Back to Mentors
      </button>

      <div class="layout">

        <!-- ── Left: Info Panel ── -->
        <div class="info-panel">
          <div class="info-icon"><span class="material-icons">school</span></div>
          <h2>Become a Mentor</h2>
          <p>Share your expertise and help learners grow on SkillSync.</p>

          <div class="benefits">
            @for (b of benefits; track b.icon) {
              <div class="benefit-item">
                <div class="benefit-icon"><span class="material-icons">{{ b.icon }}</span></div>
                <div>
                  <strong>{{ b.title }}</strong>
                  <p>{{ b.desc }}</p>
                </div>
              </div>
            }
          </div>

          <div class="process-note">
            <span class="material-icons">info</span>
            Applications are reviewed by admins within 2-3 business days.
          </div>
        </div>

        <!-- ── Right: Form / Status ── -->
        <div class="form-panel">
          <div class="form-card">

            <!-- Loading -->
            @if (checkingProfile()) {
              <div class="loading-center">
                <mat-spinner diameter="40" />
                <p>Checking your application status...</p>
              </div>
            }

            <!-- Already applied -->
            @else if (myProfile()) {
              <div class="status-card" [class]="'status-' + myProfile()!.status.toLowerCase()">
                <div class="status-icon">
                  <span class="material-icons">{{ statusIcon(myProfile()!.status) }}</span>
                </div>
                <div class="status-body">
                  <h3>Application {{ myProfile()!.status }}</h3>
                  <p>{{ statusMessage(myProfile()!.status) }}</p>
                </div>
              </div>

              <div class="profile-summary">
                <h4>Your Application Details</h4>
                <div class="summary-grid">
                  <div class="summary-item">
                    <span class="summary-label">Specialization</span>
                    <span class="summary-value">{{ myProfile()!.specialization }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Experience</span>
                    <span class="summary-value">{{ myProfile()!.yearsOfExperience }} years</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Hourly Rate</span>
                    <span class="summary-value">₹{{ myProfile()!.hourlyRate }}/hr</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Applied On</span>
                    <span class="summary-value">{{ myProfile()!.createdAt | date:'mediumDate' }}</span>
                  </div>
                </div>
              </div>

              @if (myProfile()!.status === 'APPROVED') {
                <button class="btn-dashboard" (click)="router.navigate(['/mentor-dashboard'])">
                  <span class="material-icons">dashboard</span>
                  Go to Mentor Dashboard
                </button>
              }
            }

            <!-- Application Form -->
            @else {
              <h3>Application Form</h3>
              <p class="form-sub">Tell us about your expertise</p>

              <div class="form">

                <!-- ── Skill Multi-Select ── -->
                <div class="input-group">
                  <label class="input-label">
                    Skills / Specialization <span class="required">*</span>
                    <span class="label-hint">Select all that apply</span>
                  </label>

                  <!-- Selected chips preview -->
                  @if (selectedSkills().length > 0) {
                    <div class="selected-chips">
                      @for (s of selectedSkills(); track s) {
                        <span class="selected-chip">
                          {{ s }}
                          <button type="button" (click)="toggleSkill(s)">
                            <span class="material-icons">close</span>
                          </button>
                        </span>
                      }
                    </div>
                  }

                  <!-- Search skills -->
                  <div class="skill-search-wrap">
                    <span class="material-icons">search</span>
                    <input type="text" [(ngModel)]="skillSearch"
                      placeholder="Search skills..." class="skill-search" />
                    @if (skillSearch) {
                      <button class="clear-search" (click)="skillSearch = ''">
                        <span class="material-icons">close</span>
                      </button>
                    }
                  </div>

                  <!-- Skill categories -->
                  <div class="skill-categories">
                    @for (cat of filteredCategories(); track cat.category) {
                      <div class="skill-cat">
                        <div class="cat-label">{{ cat.category }}</div>
                        <div class="skill-chips">
                          @for (skill of cat.skills; track skill) {
                            <button type="button" class="skill-chip"
                              [class.active]="isSelected(skill)"
                              (click)="toggleSkill(skill)">
                              @if (isSelected(skill)) {
                                <span class="material-icons check">check</span>
                              }
                              {{ skill }}
                            </button>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  @if (selectedSkills().length === 0 && formTouched()) {
                    <span class="field-error">Please select at least one skill</span>
                  }
                  @if (selectedSkills().length > 0) {
                    <span class="selection-count">
                      {{ selectedSkills().length }} skill{{ selectedSkills().length > 1 ? 's' : '' }} selected
                    </span>
                  }
                </div>

                <!-- Experience + Rate -->
                <div class="two-col">
                  <div class="input-group">
                    <label class="input-label">Years of Experience <span class="required">*</span></label>
                    <div class="input-wrapper" [class.focused]="focused() === 'exp'">
                      <span class="material-icons input-icon">timeline</span>
                      <input type="number" [(ngModel)]="form.yearsOfExperience"
                        placeholder="e.g. 5" min="0" max="60"
                        (focus)="focused.set('exp')" (blur)="focused.set('')" />
                    </div>
                  </div>
                  <div class="input-group">
                    <label class="input-label">Hourly Rate (₹) <span class="required">*</span></label>
                    <div class="input-wrapper" [class.focused]="focused() === 'rate'">
                      <span class="material-icons input-icon">payments</span>
                      <input type="number" [(ngModel)]="form.hourlyRate"
                        placeholder="Max ₹500" min="5" max="500"
                        (focus)="focused.set('rate')" (blur)="focused.set('')" />
                    </div>
                  </div>
                </div>

                <!-- Bio -->
                <div class="input-group">
                  <label class="input-label">Bio <span class="required">*</span></label>
                  <div class="input-wrapper textarea-wrapper" [class.focused]="focused() === 'bio'">
                    <textarea [(ngModel)]="form.bio" rows="4"
                      placeholder="Tell learners about your background, teaching style, and what you can help them achieve... (min 10 characters)"
                      (focus)="focused.set('bio')" (blur)="focused.set('')"></textarea>
                  </div>
                  <span class="char-count" [class.warn]="form.bio.length > 0 && form.bio.length < 10">
                    {{ form.bio.length }}/500
                    @if (form.bio.length > 0 && form.bio.length < 10) { · minimum 10 characters }
                  </span>
                </div>

                @if (mentorStore.error()) {
                  <div class="error-banner">
                    <span class="material-icons">error_outline</span>
                    {{ mentorStore.error() }}
                  </div>
                }

                <div class="form-actions">
                  <button class="btn-cancel" (click)="router.navigate(['/mentors'])">Cancel</button>
                  <button class="btn-submit" (click)="submit()"
                    [disabled]="selectedSkills().length === 0 || !form.yearsOfExperience || !form.hourlyRate || form.bio.length < 10 || mentorStore.loading()">
                    @if (mentorStore.loading()) {
                      <mat-spinner diameter="20" /><span>Submitting...</span>
                    } @else {
                      <span class="material-icons">send</span><span>Submit Application</span>
                    }
                  </button>
                </div>

              </div>
            }

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; }
    .back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #6b7280; font-size: 14px; font-weight: 500; cursor: pointer; padding: 8px 0; margin-bottom: 24px; transition: color 0.15s; }
    .back-btn:hover { color: #4f46e5; }
    .back-btn .material-icons { font-size: 18px; }

    .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } }

    /* Info Panel */
    .info-panel { display: flex; flex-direction: column; gap: 20px; }
    .info-icon { width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: flex; align-items: center; justify-content: center; }
    .info-icon .material-icons { font-size: 32px; color: white; }
    .info-panel h2 { font-size: 28px; font-weight: 800; color: #111827; margin: 0; }
    .info-panel > p { font-size: 15px; color: #6b7280; margin: 0; line-height: 1.6; }
    .benefits { display: flex; flex-direction: column; gap: 16px; }
    .benefit-item { display: flex; align-items: flex-start; gap: 14px; }
    .benefit-icon { width: 40px; height: 40px; border-radius: 12px; background: #eef2ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .benefit-icon .material-icons { font-size: 20px; color: #4f46e5; }
    .benefit-item strong { display: block; font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 2px; }
    .benefit-item p { font-size: 13px; color: #6b7280; margin: 0; }
    .process-note { display: flex; align-items: flex-start; gap: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 14px; font-size: 13px; color: #166534; }
    .process-note .material-icons { font-size: 18px; flex-shrink: 0; margin-top: 1px; }

    /* Form Card */
    .form-card { background: white; border-radius: 20px; border: 1px solid #e5e7eb; padding: 28px; }
    .form-card h3 { font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 4px; }
    .form-sub { font-size: 14px; color: #6b7280; margin: 0 0 24px; }
    .loading-center { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px 0; }
    .loading-center p { font-size: 14px; color: #6b7280; margin: 0; }

    /* Status */
    .status-card { display: flex; align-items: flex-start; gap: 14px; border-radius: 14px; padding: 18px; margin-bottom: 20px; }
    .status-pending   { background: #fef3c7; border: 1px solid #fde68a; }
    .status-approved  { background: #dcfce7; border: 1px solid #bbf7d0; }
    .status-rejected  { background: #fee2e2; border: 1px solid #fecaca; }
    .status-suspended { background: #f3f4f6; border: 1px solid #e5e7eb; }
    .status-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .status-pending .status-icon { background: rgba(255,255,255,0.6); } .status-pending .status-icon .material-icons { color: #d97706; font-size: 24px; }
    .status-approved .status-icon { background: rgba(255,255,255,0.6); } .status-approved .status-icon .material-icons { color: #16a34a; font-size: 24px; }
    .status-rejected .status-icon { background: rgba(255,255,255,0.6); } .status-rejected .status-icon .material-icons { color: #dc2626; font-size: 24px; }
    .status-body h3 { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .status-pending .status-body h3 { color: #92400e; } .status-approved .status-body h3 { color: #166534; } .status-rejected .status-body h3 { color: #991b1b; }
    .status-body p { font-size: 13px; margin: 0; }
    .status-pending .status-body p { color: #92400e; } .status-approved .status-body p { color: #166534; } .status-rejected .status-body p { color: #991b1b; }
    .profile-summary { margin-bottom: 20px; }
    .profile-summary h4 { font-size: 14px; font-weight: 700; color: #374151; margin: 0 0 12px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .summary-item { background: #f9fafb; border-radius: 10px; padding: 12px; border: 1px solid #e5e7eb; }
    .summary-label { display: block; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .summary-value { display: block; font-size: 14px; font-weight: 600; color: #111827; }
    .btn-dashboard { width: 100%; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(79,70,229,0.3); transition: opacity 0.2s; }
    .btn-dashboard:hover { opacity: 0.9; }
    .btn-dashboard .material-icons { font-size: 18px; }

    /* Form */
    .form { display: flex; flex-direction: column; gap: 18px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 480px) { .two-col { grid-template-columns: 1fr; } }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-label { font-size: 13px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .label-hint { font-size: 11px; color: #9ca3af; font-weight: 400; }
    .required { color: #ef4444; }

    /* Skill Multi-Select */
    .selected-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .selected-chip {
      display: flex; align-items: center; gap: 4px;
      background: #4f46e5; color: white;
      padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
    }
    .selected-chip button { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.8); display: flex; align-items: center; padding: 0; }
    .selected-chip button:hover { color: white; }
    .selected-chip button .material-icons { font-size: 14px; }

    .skill-search-wrap {
      display: flex; align-items: center; gap: 8px;
      background: #f9fafb; border: 1.5px solid #e5e7eb;
      border-radius: 10px; padding: 0 12px; height: 42px;
      margin-bottom: 12px;
    }
    .skill-search-wrap:focus-within { border-color: #4f46e5; background: white; }
    .skill-search-wrap .material-icons { font-size: 18px; color: #9ca3af; flex-shrink: 0; }
    .skill-search { flex: 1; border: none; outline: none; font-size: 14px; color: #111827; background: transparent; }
    .skill-search::placeholder { color: #9ca3af; }
    .clear-search { background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; }
    .clear-search .material-icons { font-size: 16px; }

    .skill-categories { display: flex; flex-direction: column; gap: 14px; max-height: 280px; overflow-y: auto; padding-right: 4px; }
    .skill-categories::-webkit-scrollbar { width: 4px; }
    .skill-categories::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
    .skill-cat { display: flex; flex-direction: column; gap: 8px; }
    .cat-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
    .skill-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-chip {
      display: flex; align-items: center; gap: 4px;
      padding: 5px 12px; border-radius: 20px;
      border: 1.5px solid #e5e7eb; background: white;
      color: #374151; font-size: 12px; font-weight: 500;
      cursor: pointer; transition: all 0.15s;
    }
    .skill-chip:hover { border-color: #4f46e5; color: #4f46e5; background: #f5f3ff; }
    .skill-chip.active { background: #eef2ff; border-color: #4f46e5; color: #4f46e5; font-weight: 600; }
    .skill-chip .check { font-size: 13px; }

    .field-error { font-size: 12px; color: #ef4444; }
    .selection-count { font-size: 12px; color: #4f46e5; font-weight: 600; }

    .input-wrapper { display: flex; align-items: center; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 0 14px; height: 52px; transition: border-color 0.2s, box-shadow 0.2s; }
    .input-wrapper.focused { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); background: white; }
    .input-icon { font-size: 18px; color: #9ca3af; margin-right: 10px; }
    .input-wrapper.focused .input-icon { color: #4f46e5; }
    .input-wrapper input { flex: 1; border: none; outline: none; font-size: 15px; color: #111827; background: transparent; }
    .input-wrapper input::placeholder { color: #9ca3af; }
    .textarea-wrapper { height: auto; padding: 12px 14px; align-items: flex-start; }
    .textarea-wrapper textarea { flex: 1; border: none; outline: none; font-size: 14px; color: #111827; background: transparent; resize: none; font-family: inherit; width: 100%; line-height: 1.5; }
    .textarea-wrapper textarea::placeholder { color: #9ca3af; }
    .char-count { font-size: 12px; color: #9ca3af; text-align: right; }
    .char-count.warn { color: #ef4444; }

    .error-banner { display: flex; align-items: center; gap: 8px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 12px 14px; border-radius: 10px; font-size: 14px; }
    .error-banner .material-icons { font-size: 18px; }

    .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .btn-cancel { height: 48px; padding: 0 20px; border-radius: 12px; background: #f3f4f6; color: #374151; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    .btn-cancel:hover { background: #e5e7eb; }
    .btn-submit { height: 48px; padding: 0 24px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(79,70,229,0.3); transition: opacity 0.2s; }
    .btn-submit:hover:not(:disabled) { opacity: 0.9; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-submit .material-icons { font-size: 18px; }
  `]
})
export class ApplyMentorPage implements OnInit {
  readonly mentorStore = inject(MentorStore);
  readonly skillStore = inject(SkillStore);
  readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly focused = signal('');
  readonly checkingProfile = signal(true);
  readonly myProfile = this.mentorStore.myProfile;
  readonly selectedSkills = signal<string[]>([]);
  readonly formTouched = signal(false);

  skillSearch = '';
  form = { yearsOfExperience: null as number | null, hourlyRate: null as number | null, bio: '' };

  readonly benefits = [
    { icon: 'monetization_on', title: 'Earn Income',      desc: 'Set your own hourly rate and get paid for sessions' },
    { icon: 'people',          title: 'Build Community',  desc: 'Create learning groups and grow your student base' },
    { icon: 'star',            title: 'Build Reputation', desc: 'Collect reviews and ratings from your students' },
  ];

  ngOnInit(): void {
    this.mentorStore.loadMyProfile(undefined);
    // Load skills from backend — falls back to FALLBACK_CATEGORIES if empty
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }
    setTimeout(() => this.checkingProfile.set(false), 800);
  }

  // Use backend skills grouped by category; fall back to hardcoded if backend has none
  filteredCategories() {
    const q = this.skillSearch.toLowerCase();
    const source = this.skillStore.skills().length > 0
      ? this.skillStore.groupedByCategory()
      : FALLBACK_CATEGORIES;

    if (!q) return source;
    return source
      .map(cat => ({ ...cat, skills: cat.skills.filter((s: string) => s.toLowerCase().includes(q)) }))
      .filter(cat => cat.skills.length > 0);
  }

  toggleSkill(skill: string): void {
    const current = this.selectedSkills();
    if (current.includes(skill)) {
      this.selectedSkills.set(current.filter(s => s !== skill));
    } else {
      this.selectedSkills.set([...current, skill]);
    }
  }

  isSelected(skill: string): boolean {
    return this.selectedSkills().includes(skill);
  }

  submit(): void {
    this.formTouched.set(true);
    const { yearsOfExperience, hourlyRate, bio } = this.form;
    const skills = this.selectedSkills();

    if (skills.length === 0 || !yearsOfExperience || !hourlyRate || bio.length < 10) return;
    if (hourlyRate > 500) { this.snack.open('Hourly rate cannot exceed ₹500.', 'OK', { duration: 3000 }); return; }

    const specialization = skills.join(', ');
    this.mentorStore.applyAsMentor({ specialization, yearsOfExperience, hourlyRate, bio });

    setTimeout(() => {
      if (!this.mentorStore.error()) {
        this.snack.open('Application submitted! Awaiting admin review.', 'OK', { duration: 4000 });
      }
    }, 800);
  }

  statusIcon(status: string): string {
    return { PENDING: 'hourglass_top', APPROVED: 'verified', REJECTED: 'cancel', SUSPENDED: 'block' }[status] ?? 'info';
  }

  statusMessage(status: string): string {
    return {
      PENDING:   "Your application is under review. We'll notify you once a decision is made.",
      APPROVED:  'Congratulations! You are now a mentor on SkillSync.',
      REJECTED:  'Your application was not approved this time. You may reapply later.',
      SUSPENDED: 'Your mentor account has been suspended. Contact support for details.'
    }[status] ?? '';
  }
}
