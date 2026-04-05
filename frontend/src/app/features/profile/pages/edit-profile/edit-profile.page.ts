import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { UserProfileDto } from '../../../../shared/models';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20 px-2 lg:px-0">
      
      <!-- Premium Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <button (click)="goBack()" class="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-widest hover:text-primary-700 transition-colors mb-2">
            <span class="material-icons text-sm">arrow_back</span>
            Back to Profile
          </button>
          <h1 class="text-4xl font-extrabold tracking-tight text-slate-900">Edit <span class="text-primary-600">Profile</span></h1>
          <p class="text-slate-500 font-medium italic">Shape your identity on SkillSync.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
           <div class="w-12 h-12 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin"></div>
           <p class="text-sm font-bold uppercase tracking-widest">Loading Records...</p>
        </div>
      } @else {
        <div class="glass-card p-8 md:p-12 border border-white/40 shadow-2xl shadow-primary-900/5 animate-drop-in">
          
          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-10">
            
            <!-- Section: Identity -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 border-b border-slate-50 pb-4">
                <span class="material-icons text-primary-600">fingerprint</span>
                <h3 class="text-sm font-bold uppercase tracking-widest text-slate-800">Identity & Contact</h3>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                  <input formControlName="firstName" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-medium text-slate-700" [class.border-red-300]="isInvalid('firstName')">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                  <input formControlName="lastName" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-medium text-slate-700">
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1.5 opacity-60">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email (Immutable)</label>
                  <input formControlName="email" type="email" class="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm cursor-not-allowed font-mono">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <input formControlName="phoneNumber" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-medium text-slate-700 font-mono" [class.border-red-300]="isInvalid('phoneNumber')">
                </div>
              </div>
            </div>

            <!-- Section: Professional Bio -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 border-b border-slate-50 pb-4">
                <span class="material-icons text-primary-600">history_edu</span>
                <h3 class="text-sm font-bold uppercase tracking-widest text-slate-800">Professional Bio</h3>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Tell your story</label>
                <textarea formControlName="bio" rows="5" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-medium text-slate-700 leading-relaxed resize-none" placeholder="Share your experience, passions, and goals..."></textarea>
                <div class="flex justify-end px-1">
                   <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">500 Characters Max</span>
                </div>
              </div>
            </div>

            <!-- Section: Skills Cloud -->
            <div class="space-y-6">
              <div class="flex items-center gap-3 border-b border-slate-50 pb-4">
                <span class="material-icons text-primary-600">auto_awesome</span>
                <h3 class="text-sm font-bold uppercase tracking-widest text-slate-800">Skills & Expertise</h3>
              </div>

              <div class="space-y-4">
                <!-- Selected Chips -->
                <div class="flex flex-wrap gap-2">
                  @for (s of selectedSkills(); track s) {
                    <div class="bg-primary-600 text-white pl-4 pr-2 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary-200 animate-fade-in group">
                      {{ s }}
                      <button type="button" (click)="removeSkill(s)" class="hover:bg-primary-700 p-0.5 rounded-lg transition-colors">
                        <span class="material-icons text-xs">close</span>
                      </button>
                    </div>
                  } @empty {
                    <div class="py-4 px-6 border-2 border-dashed border-slate-100 rounded-2xl text-center w-full">
                       <p class="text-xs font-bold text-slate-300 uppercase tracking-widest">No skills added yet</p>
                    </div>
                  }
                </div>

                <!-- Skill Dropdown -->
                <div class="relative group">
                  <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors">add_task</span>
                  <select (change)="addSkill($event)" class="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-bold text-slate-700 cursor-pointer appearance-none">
                    <option value="" disabled selected>Add Expertise...</option>
                    @for (cat of skillStore.groupedByCategory(); track cat.category) {
                      <optgroup [label]="cat.category">
                        @for (s of cat.skills; track s.id) {
                          <option [value]="s.name" [disabled]="selectedSkills().includes(s.name)">{{ s.name }}</option>
                        }
                      </optgroup>
                    }
                  </select>
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="pt-10 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-slate-50">
               <button type="button" (click)="goBack()" class="w-full sm:w-auto px-10 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
               <button type="submit" [disabled]="saving() || form.invalid" 
                       class="w-full sm:w-auto bg-primary-600 text-white rounded-2xl px-12 py-4 font-bold shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                  @if (saving()) {
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  } @else {
                    <span class="material-icons text-base">verified</span>
                  }
                  <span>Commit Changes</span>
               </button>
            </div>

          </form>

        </div>
      }
    </div>
  `
})
export class EditProfilePage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router      = inject(Router);
  private readonly fb          = inject(FormBuilder);
  readonly skillStore           = inject(SkillStore);
  private readonly authStore    = inject(AuthStore);

  readonly loading        = signal(true);
  readonly saving         = signal(false);
  readonly selectedSkills = signal<string[]>([]);

  readonly form = this.fb.group({
    firstName:   ['', [Validators.required]],
    lastName:    [''],
    username:    ['', [Validators.required]],
    email:       [{ value: '', disabled: true }],
    phoneNumber: ['', [Validators.required]],
    bio:         ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }

    this.userService.getMyProfile().subscribe({
      next:  res => { this.prefill(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  private prefill(p: UserProfileDto): void {
    const parts  = (p.name || '').trim().split(' ').filter(Boolean);
    const skills = p.skills ? p.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    this.form.patchValue({
      firstName:   parts[0] || '',
      lastName:    parts.slice(1).join(' ') || '',
      username:    p.username || this.authStore.username() || '',
      email:       p.email || this.authStore.email() || '',
      phoneNumber: p.phoneNumber || '',
      bio:         p.bio || ''
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
    if (this.form.invalid) return;
    const val  = this.form.getRawValue();
    const name = `${val.firstName ?? ''} ${val.lastName ?? ''}`.trim();

    this.saving.set(true);
    this.userService.updateProfile({
      username:    val.username?.trim(),
      name,
      bio:         val.bio?.trim() || undefined,
      phoneNumber: val.phoneNumber?.trim() || undefined,
      skills:      this.selectedSkills().join(',') || undefined
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.userService.updateUser(res.data);
        this.authStore.updateUser(res.data.name, res.data.username);
        this.router.navigate(['/profile']);
      },
      error: () => this.saving.set(false)
    });
  }

  goBack(): void { this.router.navigate(['/profile']); }
}
