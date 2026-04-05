import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-apply-mentor-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20 px-2 lg:px-4">
      
      <!-- Back Button -->
      <button (click)="router.navigate(['/mentors'])" class="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-primary-600 transition-colors">
        <span class="material-icons text-sm">arrow_back</span>
        Back to Directory
      </button>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <!-- Left Side: Branding & Value Proposition -->
        <div class="lg:col-span-5 space-y-8 sticky top-24">
          <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-200">
            <span class="material-icons text-3xl">rocket_launch</span>
          </div>
          
          <div class="space-y-4">
            <h1 class="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">Elevate your career as a <span class="text-primary-600 underline underline-offset-8 decoration-primary-200">Mentor</span></h1>
            <p class="text-slate-500 text-lg font-medium leading-relaxed">Join a global network of experts. Share your knowledge, inspire the next generation, and monetize your expertise.</p>
          </div>

          <div class="space-y-6">
            @for (b of benefits; track b.title) {
              <div class="flex gap-4 group">
                <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                  <span class="material-icons text-xl">{{ b.icon }}</span>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-800 uppercase tracking-wide">{{ b.title }}</h4>
                  <p class="text-xs text-slate-500 font-medium leading-relaxed mt-1">{{ b.desc }}</p>
                </div>
              </div>
            }
          </div>

          <div class="p-6 rounded-[2rem] bg-emerald-50/50 border border-emerald-100 flex gap-4 items-start">
            <span class="material-icons text-emerald-500">verified</span>
            <p class="text-[11px] font-bold text-emerald-700 uppercase tracking-widest leading-relaxed">Fast review process: Get approved and start mentoring in as little as 48 hours.</p>
          </div>
        </div>

        <!-- Right Side: Interaction Area -->
        <div class="lg:col-span-7">
          
          @if (checkingProfile()) {
            <div class="h-[600px] glass-card flex flex-col items-center justify-center gap-4 text-slate-400">
               <div class="w-10 h-10 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin"></div>
               <p class="text-[10px] font-bold uppercase tracking-[0.2em]">Synchronizing Records...</p>
            </div>
          } 
          
          @else if (myProfile()) {
            <div class="glass-card p-10 space-y-10 border border-white/40 shadow-2xl animate-drop-in">
              
              <!-- Status Header -->
              <div class="flex flex-col items-center text-center space-y-4">
                <div class="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl mb-2" [ngClass]="statusClasses().bg">
                  <span class="material-icons text-4xl text-white">{{ statusIcon(myProfile()!.status) }}</span>
                </div>
                <div>
                  <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Application {{ myProfile()!.status }}</h2>
                  <p class="text-slate-500 font-medium text-sm mt-1 px-8">{{ statusMessage(myProfile()!.status) }}</p>
                </div>
              </div>

              <!-- Summary Table -->
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                   <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                   <p class="font-extrabold text-slate-800" [ngClass]="statusClasses().text">{{ myProfile()!.status }}</p>
                </div>
                <div class="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                   <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rate</p>
                   <p class="font-extrabold text-slate-800">₹{{ myProfile()!.hourlyRate }}<span class="text-[11px] text-slate-400"> /hr</span></p>
                </div>
                <div class="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                   <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Experience</p>
                   <p class="font-extrabold text-slate-800">{{ myProfile()!.yearsOfExperience }}<span class="text-[11px] text-slate-400"> Years</span></p>
                </div>
                <div class="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                   <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created</p>
                   <p class="font-extrabold text-slate-800">{{ myProfile()!.createdAt | date:'MMM d' }}</p>
                </div>
              </div>

              @if (myProfile()!.status === 'APPROVED') {
                <button (click)="router.navigate(['/mentor-dashboard'])" class="w-full bg-primary-600 text-white rounded-2xl py-4 font-bold shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3">
                  <span class="material-icons text-xl">speed</span>
                  Enter Mentor Dashboard
                </button>
              }
            </div>
          }

          @else {
            <div class="glass-card p-8 md:p-12 border border-white/40 shadow-2xl animate-drop-in">
              <form (ngSubmit)="submit()" class="space-y-10">
                
                <!-- Section: Expertise -->
                <div class="space-y-6">
                  <div class="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <span class="material-icons text-primary-600">psychology_alt</span>
                    <h3 class="text-sm font-bold uppercase tracking-widest text-slate-800">Your Expertise</h3>
                  </div>

                  <div class="space-y-4">
                    <!-- Selected Chips -->
                    <div class="flex flex-wrap gap-2">
                      @for (s of selectedSkills(); track s) {
                        <div class="bg-secondary-600 text-white pl-4 pr-1.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-secondary-100 animate-fade-in group">
                          {{ s }}
                          <button type="button" (click)="toggleSkill(s)" class="hover:bg-secondary-700 p-0.5 rounded-lg transition-colors">
                            <span class="material-icons text-xs">close</span>
                          </button>
                        </div>
                      }
                    </div>

                    <!-- Search Input -->
                    <div class="relative group">
                      <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors">search</span>
                      <input type="text" [(ngModel)]="skillSearch" name="skillSearch" placeholder="Search skills (e.g. Angular, Node.js)..." class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-medium text-slate-700">
                    </div>

                    <!-- Scrollable Categories -->
                    <div class="max-h-[300px] overflow-y-auto space-y-6 pr-2 scrollbar-none border border-slate-50 rounded-2xl p-4">
                      @for (cat of filteredCategories(); track cat.category) {
                        <div class="space-y-3">
                          <p class="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">{{ cat.category }}</p>
                          <div class="flex flex-wrap gap-2">
                            @for (s of cat.skills; track s.id) {
                              <button type="button" (click)="toggleSkill(s.name)"
                                [class.bg-primary-50]="isSelected(s.name)"
                                [class.text-primary-600]="isSelected(s.name)"
                                [class.ring-2]="isSelected(s.name)"
                                [class.ring-primary-500]="isSelected(s.name)"
                                class="px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-slate-100 hover:border-primary-200 transition-all active:scale-95 text-slate-500">
                                {{ s.name }}
                              </button>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <!-- Section: Business Details -->
                <div class="space-y-6">
                  <div class="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <span class="material-icons text-primary-600">payments</span>
                    <h3 class="text-sm font-bold uppercase tracking-widest text-slate-800">Business & Experience</h3>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Years of Exp.</label>
                      <input type="number" [(ngModel)]="form.yearsOfExperience" name="yearsOfExperience" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-bold text-slate-700 font-mono" placeholder="e.g. 8">
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Hourly Rate (₹)</label>
                      <input type="number" [(ngModel)]="form.hourlyRate" name="hourlyRate" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-bold text-slate-700 font-mono" placeholder="Max ₹500">
                    </div>
                  </div>

                  <div class="space-y-1.5">
                    <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Professional Pitch</label>
                    <textarea [(ngModel)]="form.bio" name="bio" rows="4" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-medium text-slate-700 leading-relaxed resize-none" placeholder="Explain why you are the best mentor for your skills... (min 10 chars)"></textarea>
                    <div class="flex justify-end text-[9px] font-bold uppercase tracking-widest" [class.text-red-500]="form.bio.length < 10">
                       {{ form.bio.length }}/500 {{ form.bio.length < 10 ? '· Min 10 chars required' : '' }}
                    </div>
                  </div>
                </div>

                <!-- Submit Action -->
                <div class="pt-6">
                  <button type="submit" [disabled]="!isFormValid() || mentorStore.loading()" class="w-full bg-primary-600 text-white rounded-[1.5rem] py-5 font-bold shadow-2xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    @if (mentorStore.loading()) {
                      <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying Credentials...</span>
                    } @else {
                      <span class="material-icons text-xl">send</span>
                      <span>Submit Mentor Application</span>
                    }
                  </button>
                </div>

              </form>
            </div>
          }
        </div>

      </div>
    </div>
  `
})
export class ApplyMentorPage implements OnInit {
  readonly mentorStore = inject(MentorStore);
  readonly skillStore = inject(SkillStore);
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);

  readonly checkingProfile = signal(true);
  readonly myProfile = this.mentorStore.myProfile;
  readonly selectedSkills = signal<string[]>([]);
  
  skillSearch = '';
  form = { yearsOfExperience: null as number | null, hourlyRate: null as number | null, bio: '' };

  readonly benefits = [
    { icon: 'payments', title: 'Monetize Skillsets', desc: 'Turn your professional experience into a secondary income stream with hourly-based sessions.' },
    { icon: 'public', title: 'Global Impact', desc: 'Connect with students across time zones and help bridge the professional skill gap worldwide.' },
    { icon: 'workspace_premium', title: 'Verified Badge', desc: 'Successful mentors receive a verified checkmark increasing visibility and trust in the marketplace.' },
  ];

  statusClasses = computed(() => {
    const s = this.myProfile()?.status || 'PENDING';
    const map: Record<string, any> = {
      'PENDING': { bg: 'bg-amber-500 shadow-amber-100', text: 'text-amber-600' },
      'APPROVED': { bg: 'bg-emerald-500 shadow-emerald-100', text: 'text-emerald-600' },
      'REJECTED': { bg: 'bg-red-500 shadow-red-100', text: 'text-red-600' }
    };
    return map[s] || map['PENDING'];
  });

  ngOnInit(): void {
    this.mentorStore.loadMyProfile(undefined);
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }
    setTimeout(() => this.checkingProfile.set(false), 1200);
  }

  isFormValid(): boolean {
    const { yearsOfExperience, hourlyRate, bio } = this.form;
    return this.selectedSkills().length > 0 && 
           !!yearsOfExperience && 
           !!hourlyRate && 
           hourlyRate <= 500 && 
           bio.length >= 10;
  }

  filteredCategories() {
    const q = this.skillSearch.toLowerCase().trim();
    const source = this.skillStore.groupedByCategory();
    if (!q) return source;
    return source.map(cat => ({ ...cat, skills: cat.skills.filter(s => s.name.toLowerCase().includes(q)) })).filter(cat => cat.skills.length > 0);
  }

  toggleSkill(skill: string): void {
    this.selectedSkills.update(current => current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill]);
  }

  isSelected(skill: string): boolean {
    return this.selectedSkills().includes(skill);
  }

  submit(): void {
    if (!this.isFormValid()) return;
    const { yearsOfExperience, hourlyRate, bio } = this.form;
    const specialization = this.selectedSkills().join(', ');
    
    this.mentorStore.applyAsMentor({ 
      specialization, 
      yearsOfExperience: yearsOfExperience || 0, 
      hourlyRate: hourlyRate || 0, 
      bio 
    });

    setTimeout(() => {
      if (!this.mentorStore.error()) {
        this.authStore.addRole('ROLE_MENTOR');
      }
    }, 1000);
  }

  statusIcon(status: string): string {
    const icons: Record<string, string> = { PENDING: 'hourglass_empty', APPROVED: 'verified', REJECTED: 'cancel' };
    return icons[status] ?? 'info';
  }

  statusMessage(status: string): string {
    const msgs: Record<string, string> = {
      PENDING: "Hang tight! Our curators are reviewing your profile. We'll update you here soon.",
      APPROVED: 'Welcome to the inner circle! Your mentor capabilities are now fully unlocked.',
      REJECTED: 'Your application was declined. You can re-apply once you have more experience.'
    };
    return msgs[status] ?? '';
  }
}
