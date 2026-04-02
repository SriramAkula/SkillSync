import { Component, inject, OnInit, signal, effect, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { UserProfileDto } from '../../../../shared/models';
import { ToastService } from '../../../../core/services/toast.service';
import { ProfileCompletionService } from '../../../../core/services/profile-completion.service';

interface UserActivity {
  id: string;
  icon: string;
  colorClass: string;
  text: string;
  timestamp: number;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <!-- CONFETTI CANVAS -->
    @if (showConfetti()) {
      <div class="confetti-container">
        @for (c of confettiDrops; track $index) {
           <div class="confetti" [style.left.%]="c.x" [style.animationDelay.s]="c.delay" [style.backgroundColor]="c.color"></div>
        }
      </div>
    }

    <div class="page-container" [class.edit-mode]="isEditing()">
      <!-- Profile Completion Banner -->
      <div class="completion-banner" [class.complete]="completionPercentage() === 100">
        <div class="banner-top">
          <div class="banner-info">
            <h3 class="banner-title">
              @if (completionPercentage() === 100) {
                🎉 Profile Complete!
              } @else {
                Profile {{ completionPercentage() }}% complete — Level: {{ profileLevel() }}
              }
            </h3>
            <p class="banner-hint">
              @if (completionPercentage() === 100) {
                You are all set to connect with mentors and peers!
              } @else {
                Complete your profile to reach 'Pro' status and get better matches.
              }
            </p>
          </div>
          @if (completionPercentage() < 100) {
            <button class="expand-hints-btn" (click)="toggleHints()">
              {{ hintsExpanded() ? 'Hide Details' : 'Show Details' }}
            </button>
          }
        </div>
        
        <div class="progress-section" title="Complete profile to get better mentor matches">
          <div class="progress-track">
            <div class="progress-fill" 
                 [style.width.%]="completionPercentage()"
                 [class.low]="completionPercentage() < 40"
                 [class.mid]="completionPercentage() >= 40 && completionPercentage() < 80"
                 [class.high]="completionPercentage() >= 80">
            </div>
          </div>
        </div>

        <!-- Smart Hints Dropdown -->
        @if (hintsExpanded() && completionPercentage() < 100) {
           <div class="hints-dropdown">
             <ul class="hints-list">
               @for (f of completionService.getMissingFields(profile()); track f.key) {
                 <li class="hint-item missing" (click)="editField(f.key)"><span class="material-icons">close</span> Missing {{ f.label }}</li>
               }
               <!-- Mock showing completed fields for 'why' breakdown -->
               <li class="hint-item complete"><span class="material-icons">check</span> Username</li>
               <li class="hint-item complete"><span class="material-icons">check</span> Email</li>
             </ul>
           </div>
        }
      </div>

      <!-- Header Area -->
      <div class="header-section">
        <div class="header-content">
          <h1>My Profile</h1>
          <p>Manage your account settings and profile information</p>
        </div>
        <div class="header-actions">
           <!-- Visibility Toggle (UI only) -->
           <div class="visibility-toggle" (click)="toggleVisibility()" title="Toggle Profile Visibility">
              <span class="material-icons">{{ isPrivate() ? 'lock' : 'public' }}</span>
              <span>{{ isPrivate() ? 'Private' : 'Public' }}</span>
           </div>
          <button class="logout-btn" (click)="logout()">
            <span class="material-icons">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <!-- Loading State (Skeleton) -->
      @if (loading()) {
        <div class="profile-layout">
          <div class="profile-sidebar skeleton-box sidebar-skeleton">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-text w-60"></div>
            <div class="skeleton-text w-40"></div>
          </div>
          <div class="profile-main skeleton-box main-skeleton">
            <div class="skeleton-title w-30"></div>
            <div class="skeleton-text w-100 h-line"></div>
            <div class="skeleton-text w-100 h-line"></div>
            <div class="skeleton-text w-80 h-line"></div>
          </div>
        </div>
      }

      <!-- Profile Content -->
      @if (profile() && !loading()) {
        <div class="profile-layout">
          
          <!-- Sidebar -->
          <div class="profile-sidebar">
            <div class="user-card">
              <div class="user-avatar-wrap" 
                   [class.drag-over]="isDragOver()"
                   (dragover)="onDragOver($event)" 
                   (dragleave)="onDragLeave($event)" 
                   (drop)="onDrop($event)">
                
                <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/png, image/jpeg" hidden />
                
                <div class="user-avatar">
                  @if (avatarUrl()) {
                    <img [src]="avatarUrl()!" alt="Avatar" class="avatar-img" />
                  } @else {
                    {{ initials() }}
                  }
                </div>
                
                <div class="avatar-overlay" (click)="fileInput.click()">
                  <span class="material-icons">photo_camera</span>
                  <span style="font-size: 11px;">Change Photo</span>
                </div>

                <div class="add-avatar-btn" (click)="fileInput.click()" title="Upload Photo">
                  <span class="material-icons">add</span>
                </div>
              </div>

              <h2 class="user-name">{{ fullName() }}</h2>
              <div class="user-email">
                 {{ profile()!.email }}
                 <span class="material-icons copy-icon" (click)="copyToClipboard(profile()!.email)" title="Copy Email">content_copy</span>
              </div>
              <div class="user-handle">
                 &#64;{{ displayUsername() }}
                 <span class="material-icons copy-icon" (click)="copyToClipboard(displayUsername())" title="Copy Username">content_copy</span>
              </div>
              
              <div class="badge-row">
                <span class="role-pill learner">
                  <span class="pulse"></span> Learner
                </span>
                @if (showBadge()) {
                  <span class="complete-badge">100% Complete</span>
                }
              </div>

              @if (profile()!.createdAt) {
                <div class="joined-date">
                  <span class="material-icons">event</span>
                  Joined {{ profile()!.createdAt | date:'mediumDate' }}
                </div>
              }
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="profile-main">
            <div class="content-card">
              <div class="card-header">
                <h3>Account Details <span class="header-shortcut-hint" *ngIf="isEditing()">[ Esc to cancel, Ctrl+S to save ]</span></h3>
                
                <!-- Preview / Edit Toggle -->
                <div class="mode-toggle" (click)="toggleEdit()">
                  <div class="toggle-track">
                     <div class="toggle-pill" [class.right]="isEditing()"></div>
                     <div class="toggle-opt" [class.active]="!isEditing()">
                        <span class="material-icons">visibility</span> Preview
                     </div>
                     <div class="toggle-opt" [class.active]="isEditing()">
                        <span class="material-icons">edit_note</span> Edit Mode
                     </div>
                  </div>
                </div>
              </div>

              <form [formGroup]="form" (ngSubmit)="save()" class="notion-form">
                
                <!-- Section: Personal Info -->
                <div class="form-section">
                  <div class="section-header" (click)="toggleSection('personal')">
                     <span class="material-icons section-carat" [class.open]="sectionsExpanded().personal">expand_more</span>
                     <h4 class="section-title">Personal Information</h4>
                  </div>
                  
                  @if (sectionsExpanded().personal) {
                     <div class="form-grid">
                       <div class="form-group span-2 inline-field" [class.editing]="isEditing()" [class.missing-field]="isFieldMissing('username')">
                         <label>Username</label>
                         @if (isEditing()) {
                            <input type="text" formControlName="username" placeholder="Enter username" />
                         } @else {
                            <div class="inline-value" (click)="editField('username')">&#64;{{ form.get('username')?.value || 'Not set' }} <span class="material-icons edit-icon">edit</span></div>
                         }
                       </div>
                       
                       <div class="form-group inline-field" [class.editing]="isEditing()" [class.missing-field]="isFieldMissing('firstName')">
                         <label>First Name</label>
                         @if (isEditing()) {
                            <input type="text" formControlName="firstName" placeholder="First name" />
                         } @else {
                            <div class="inline-value" (click)="editField('firstName')">{{ form.get('firstName')?.value || 'Not set' }} <span class="material-icons edit-icon">edit</span></div>
                         }
                       </div>
                       
                       <div class="form-group inline-field" [class.editing]="isEditing()" [class.missing-field]="isFieldMissing('lastName')">
                         <label>Last Name</label>
                         @if (isEditing()) {
                            <input type="text" formControlName="lastName" placeholder="Last name" />
                         } @else {
                            <div class="inline-value" (click)="editField('lastName')">{{ form.get('lastName')?.value || 'Not set' }} <span class="material-icons edit-icon">edit</span></div>
                         }
                       </div>
                     </div>
                  }
                </div>

                <!-- Section: Contact Details -->
                <div class="form-section">
                  <div class="section-header" (click)="toggleSection('contact')">
                     <span class="material-icons section-carat" [class.open]="sectionsExpanded().contact">expand_more</span>
                     <h4 class="section-title">Contact Details</h4>
                  </div>
                  @if (sectionsExpanded().contact) {
                     <div class="form-grid">
                       <div class="form-group inline-field">
                         <label>Email Address</label>
                         <div class="inline-value locked">
                           {{ profile()!.email }} <span class="material-icons lock-icon" title="Cannot be changed">lock</span>
                         </div>
                       </div>
                       <div class="form-group inline-field" [class.editing]="isEditing()" [class.missing-field]="isFieldMissing('phoneNumber')">
                         <label>Phone Number</label>
                         @if (isEditing()) {
                            <input type="text" formControlName="phoneNumber" placeholder="10-digit number" />
                         } @else {
                            <div class="inline-value" (click)="editField('phoneNumber')">{{ form.get('phoneNumber')?.value || 'Not provided' }} <span class="material-icons edit-icon" >edit</span></div>
                         }
                       </div>
                     </div>
                  }
                </div>

                <!-- Section: About Me -->
                <div class="form-section">
                  <div class="section-header" (click)="toggleSection('about')">
                     <span class="material-icons section-carat" [class.open]="sectionsExpanded().about">expand_more</span>
                     <h4 class="section-title">About Me</h4>
                  </div>
                  @if (sectionsExpanded().about) {
                     <div class="form-group inline-field span-2" [class.editing]="isEditing()" [class.missing-field]="isFieldMissing('bio')">
                       @if (isEditing()) {
                          <textarea formControlName="bio" rows="3" placeholder="Tell us about yourself..."></textarea>
                       } @else {
                          @if (form.get('bio')?.value) {
                             <div class="inline-value bio-text" (click)="editField('bio')">{{ form.get('bio')?.value }} <span class="material-icons edit-icon">edit</span></div>
                          } @else {
                             <div class="smart-suggestion" (click)="editField('bio')">
                                <span class="material-icons">info</span> 
                                <span>⚠ Add a short bio to let others know you better.</span>
                             </div>
                          }
                       }
                     </div>
                  }
                </div>

                <!-- Section: Skills -->
                <div class="form-section">
                  <div class="section-header" (click)="toggleSection('skills')">
                     <span class="material-icons section-carat" [class.open]="sectionsExpanded().skills">expand_more</span>
                     <h4 class="section-title">Professional Skills</h4>
                  </div>
                  @if (sectionsExpanded().skills) {
                     <div class="form-group inline-field span-2" [class.editing]="isEditing()" [class.missing-field]="isFieldMissing('skills')">
                       @if (isEditing()) {
                          <div class="interactive-skills">
                            <div class="skill-tags">
                              @for (skill of selectedSkills(); track skill) {
                                <span class="tag editable">
                                   {{ skill }} <span class="material-icons remove-tag" (click)="removeSkill(skill)">close</span>
                                </span>
                              }
                            </div>
                            <div class="custom-dropdown" (click)="toggleSkillDropdown()">
                              <div class="dropdown-display">
                                <span class="placeholder">+ Add skills</span>
                                <span class="material-icons arrow" [class.open]="isSkillDropdownOpen()">expand_more</span>
                              </div>
                              @if (isSkillDropdownOpen()) {
                                <div class="dropdown-menu">
                                  @for (skill of allSkillOptions(); track skill) {
                                    <div class="dropdown-item" (click)="toggleSkill(skill, $event)" [class.selected]="selectedSkills().includes(skill)">
                                      {{ skill }}
                                      @if (selectedSkills().includes(skill)) { <span class="material-icons check">check</span> }
                                    </div>
                                  }
                                </div>
                              }
                            </div>
                          </div>
                       } @else {
                          @if (selectedSkills().length > 0) {
                             <div class="skill-tags">
                                @for (skill of selectedSkills(); track skill) {
                                  <span class="tag view-only">{{ skill }}</span>
                                }
                                <span class="material-icons edit-icon" (click)="editField('skills')" style="cursor: pointer; opacity: 0.5; margin-left: 8px;">edit</span>
                             </div>
                          } @else {
                             <div class="smart-suggestion" (click)="editField('skills')">
                                <span class="material-icons">lightbulb</span> 
                                <span>⚠ Add skills to improve mentor matches.</span>
                             </div>
                          }
                       }
                     </div>
                  }
                </div>

                <!-- Sticky Save Bar -->
                @if (isEditing()) {
                  <div class="sticky-save-bar form-actions">
                     <span class="unsaved-text">You have unsaved changes. <span class="hint">Press Ctrl+S</span></span>
                     <div class="action-btns">
                       <button type="button" class="btn-cancel" (click)="cancelEdit()" [disabled]="saving()">Cancel</button>
                       <button type="submit" class="btn-submit" [disabled]="saving() || form.invalid">
                         @if (saving()) {
                           <mat-progress-spinner diameter="18" mode="indeterminate" style="display:inline-block; vertical-align: middle; margin-right: 8px;"></mat-progress-spinner>
                           Saving...
                         } @else {
                           Save Changes
                         }
                       </button>
                     </div>
                  </div>
                }
              </form>
            </div>

            <!-- Activity Timeline Component -->
            <div class="activity-card">
              <h3 class="activity-title">Recent Activity</h3>
              <div class="timeline">
                 @for (act of activities(); track act.id) {
                   <div class="timeline-item">
                      <div class="tl-icon" [ngClass]="act.colorClass"><span class="material-icons">{{ act.icon }}</span></div>
                      <div class="tl-content">
                         <p class="tl-text">{{ act.text }}</p>
                         <p class="tl-time">{{ formatTime(act.timestamp) }}</p>
                      </div>
                   </div>
                 } @empty {
                   <p style="color: var(--text-secondary); font-size: 13px;">No recent activity.</p>
                 }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly completionService = inject(ProfileCompletionService);
  readonly authStore = inject(AuthStore);
  readonly skillStore = inject(SkillStore);

  readonly profile = signal<UserProfileDto | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly isEditing = signal(false);
  readonly showBadge = signal(false);
  readonly avatarUrl = signal<string | null>(null);
  readonly isSkillDropdownOpen = signal(false);
  readonly hintsExpanded = signal(false);
  readonly isPrivate = signal(false);
  readonly showConfetti = signal(false);
  readonly isDragOver = signal(false);
  readonly activities = signal<UserActivity[]>([]);

  readonly sectionsExpanded = signal({
    personal: true,
    contact: true,
    about: true,
    skills: true
  });

  confettiDrops: any[] = [];

  private readonly SOFT_SKILLS = [
    'Problem Solving', 'Adaptability', 'Communication', 'Teamwork', 
    'Leadership', 'Time Management', 'Creativity', 'Critical Thinking'
  ];

  readonly allSkillOptions = computed(() => {
    const backend = this.skillStore.skillNames();
    return [...new Set([...backend, ...this.SOFT_SKILLS])].sort();
  });

  readonly form = this.fb.group({
    username:    ['', [Validators.required, Validators.minLength(2)]],
    firstName:   ['', [Validators.required]],
    lastName:    [''],
    bio:         ['', [Validators.maxLength(500)]],
    phoneNumber: ['', [Validators.pattern('^[6789][0-9]{9}$')]],
    skills:      [[] as string[]]
  });

  constructor() {
    effect(() => {
      const percentage = this.completionPercentage();
      if (percentage === 100 && !this.showBadge() && this.profile()) { 
        this.showBadge.set(true);
        localStorage.setItem('profileBadge', 'true');
        this.triggerConfetti();
      }
    }, { allowSignalWrites: true });
  }

  // Computed properties
  readonly completionPercentage = computed(() => this.completionService.calculateCompletion(this.profile()));
  readonly missingFields = computed(() => this.completionService.getMissingFields(this.profile()));
  
  readonly profileLevel = computed(() => {
    const p = this.completionPercentage();
    if (p < 40) return 'Beginner 🥉';
    if (p < 80) return 'Intermediate 🥈';
    return 'Pro 🥇';
  });

  selectedSkills(): string[] {
    return (this.form.get('skills')?.value || []) as string[];
  }

  ngOnInit(): void {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) this.avatarUrl.set(savedAvatar);

    const savedBadge = localStorage.getItem('profileBadge');
    if (savedBadge === 'true') this.showBadge.set(true);

    this.loadActivities();
    this.skillStore.loadAll(undefined);
    this.refreshProfile();
  }

  loadActivities() {
    const saved = localStorage.getItem('userActivities');
    if (saved) {
      this.activities.set(JSON.parse(saved));
    } else {
      this.addActivity('person_add', 'bg-green', 'Joined SkillSync Platform');
    }
  }

  addActivity(icon: string, colorClass: string, text: string) {
    const act: UserActivity = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      icon, colorClass, text, timestamp: Date.now()
    };
    const updated = [act, ...this.activities()].slice(0, 10);
    this.activities.set(updated);
    localStorage.setItem('userActivities', JSON.stringify(updated));
  }

  formatTime(ts: number): string {
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }

  triggerConfetti() {
    this.confettiDrops = Array.from({ length: 50 }).map((_, i) => ({
      x: Math.random() * 100,
      delay: Math.random() * 3,
      color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][Math.floor(Math.random()*6)]
    }));
    this.showConfetti.set(true);
    setTimeout(() => this.showConfetti.set(false), 5000);
  }

  toggleVisibility() {
    this.isPrivate.set(!this.isPrivate());
    const status = this.isPrivate() ? "Private" : "Public";
    this.toast.success(`Profile visibility set to ${status}`);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success("Copied to clipboard 📋");
    });
  }

  toggleHints() {
    this.hintsExpanded.update(v => !v);
  }

  toggleSection(section: 'personal' | 'contact' | 'about' | 'skills') {
    this.sectionsExpanded.update(s => ({ ...s, [section]: !s[section] }));
  }

  toggleEdit(): void {
    if (!this.profile()) return;
    this.isEditing.update(v => !v);
    if (!this.isEditing()) {
       this.patchFormValues(this.profile()!);
    }
  }

  editField(fieldName: string) {
    if (!this.isEditing()) {
      this.isEditing.set(true);
    }
    const sec = this.sectionsExpanded();
    if (['firstName', 'lastName', 'username'].includes(fieldName) && !sec.personal) this.toggleSection('personal');
    if (fieldName === 'phoneNumber' && !sec.contact) this.toggleSection('contact');
    if (fieldName === 'bio' && !sec.about) this.toggleSection('about');
    if (fieldName === 'skills' && !sec.skills) this.toggleSection('skills');
    
    setTimeout(() => {
      const el = document.querySelector(`[formControlName="${fieldName}"]`) as HTMLElement;
      if (el) el.focus();
    }, 100);
  }

  cancelEdit() {
    this.isEditing.set(false);
    if (this.profile()) {
      this.patchFormValues(this.profile()!);
    }
  }

  patchFormValues(p: UserProfileDto) {
    let first = '', last = '';
    if (p.name) {
      const parts = p.name.trim().split(' ');
      first = parts[0];
      last = parts.slice(1).join(' ');
    }

    let parsedSkills: string[] = [];
    if (p.skills) {
      parsedSkills = p.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    this.form.patchValue({
      username: p.username || p.email.split('@')[0],
      firstName: first || p.firstName || '',
      lastName: last || p.lastName || '',
      bio: p.bio || '',
      phoneNumber: p.phoneNumber || '',
      skills: parsedSkills as any
    });
  }

  refreshProfile(): void {
    this.loading.set(true);
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        const p = res.data;
        this.profile.set(p);
        this.userService.setUser(p);
        this.patchFormValues(p);
        setTimeout(() => this.loading.set(false), 800);
      },
      error: () => this.loading.set(false)
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error("Please fill required fields correctly.");
      return;
    }
    this.saving.set(true);
    
    const oldSkills = this.profile()?.skills || '';
    
    const val = this.form.getRawValue();
    const newSkillsStr = Array.isArray(val.skills) ? val.skills.join(',') : (val.skills || '');
    const combinedName = `${val.firstName ?? ''} ${val.lastName ?? ''}`.trim();

    this.userService.updateProfile({
      username: val.username || undefined,
      name: combinedName || undefined,
      bio: val.bio || undefined,
      phoneNumber: val.phoneNumber || undefined,
      skills: newSkillsStr || undefined
    }).subscribe({
      next: (res) => {
        const updated = res.data;
        this.profile.set(updated);
        this.userService.updateUser(updated);  
        this.saving.set(false);
        this.isEditing.set(false);
        this.toast.success("Profile updated ✅");
        
        this.addActivity('edit', 'bg-blue', 'Updated profile details');
        
        if (oldSkills !== newSkillsStr && newSkillsStr.length > oldSkills.length) {
          this.addActivity('star', 'bg-indigo', 'Added new skills');
        }
        
        this.patchFormValues(updated);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error("Failed to update profile.");
      }
    });
  }

  logout(): void { this.authStore.logout(); }

  displayUsername(): string {
    const p = this.profile();
    if (!p) return '';
    if (p.username && p.username.trim()) return p.username;
    return p.email.split('@')[0];
  }

  initials(): string {
    const p = this.profile();
    if (!p) return '?';
    const name = p.name || this.displayUsername() || '';
    return name.charAt(0).toUpperCase();
  }

  fullName(): string {
    const p = this.profile();
    if (!p) return '';
    return p.name || this.displayUsername();
  }

  isFieldMissing(key: string): boolean {
    if (key === 'username') return !this.form.get('username')?.value;
    if (key === 'firstName') return !this.form.get('firstName')?.value;
    if (key === 'lastName') return false; 
    return this.missingFields().some(f => f.key === key);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.handleFile(target.files[0]);
      target.value = '';
    }
  }
  private handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.toast.error("Only image files are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.toast.error("File size must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.avatarUrl.set(base64);
      localStorage.setItem('userAvatar', base64);
      this.addActivity('photo_camera', 'bg-indigo', 'Updated profile picture');
      this.toast.success("Avatar uploaded ✅");
    };
    reader.readAsDataURL(file);
  }

  toggleSkillDropdown(): void {
    this.isSkillDropdownOpen.update(v => !v);
  }

  toggleSkill(skill: string, event: Event): void {
    event.stopPropagation();
    const curr = this.selectedSkills();
    if (curr.includes(skill)) {
      this.form.patchValue({ skills: curr.filter(s => s !== skill) as any });
    } else {
      this.form.patchValue({ skills: [...curr, skill] as any });
    }
  }
  removeSkill(skill: string) {
    const curr = this.selectedSkills();
    this.form.patchValue({ skills: curr.filter(s => s !== skill) as any });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.isEditing()) {
      if (event.key === 'Escape') {
        this.cancelEdit();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        this.save();
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown') && !target.closest('.interactive-skills')) {
      this.isSkillDropdownOpen.set(false);
    }
  }
}
