import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { patchState } from '@ngrx/signals';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { SkillStore } from '../../../../core/auth/skill.store';

@Component({
  selector: 'app-request-session-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20 px-2 lg:px-4">
      
      <!-- Premium Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <button (click)="back()" class="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-widest hover:text-primary-700 transition-colors mb-2">
            <span class="material-icons text-sm">arrow_back</span>
            Back to Catalog
          </button>
          <h1 class="text-4xl font-extrabold tracking-tight text-slate-900">Book <span class="text-primary-600">Expert</span> Session</h1>
          <p class="text-slate-500 font-medium italic">Your personalized learning path starts with a single request.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        <!-- Left: Mentor & Context -->
        <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          @if (mentorStore.selected(); as mentor) {
            <div class="glass-card p-8 border border-white/40 shadow-2xl space-y-8 animate-drop-in">
              <div class="flex flex-col items-center text-center space-y-4">
                 <div class="w-24 h-24 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-[2.5rem] p-1 shadow-xl">
                    <div class="w-full h-full bg-white rounded-[2.3rem] flex items-center justify-center overflow-hidden">
                       @if (mentor.profileImageUrl) {
                         <img [src]="mentor.profileImageUrl" class="w-full h-full object-cover">
                       } @else {
                         <span class="text-3xl font-extrabold text-primary-600">{{ mentorInitials() }}</span>
                       }
                    </div>
                 </div>
                 <div>
                    <h3 class="text-xl font-extrabold text-slate-900 tracking-tight">{{ mentor.name || mentor.username }}</h3>
                    <p class="text-xs font-bold text-primary-600 uppercase tracking-widest mt-1">{{ mentor.specialization }}</p>
                 </div>
              </div>

              <div class="space-y-4 pt-4 border-t border-slate-50">
                 <div class="flex justify-between items-center text-sm">
                    <span class="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Hourly Rate</span>
                    <span class="font-extrabold text-slate-800">₹{{ mentor.hourlyRate }}</span>
                 </div>
                 <div class="flex justify-between items-center text-sm">
                    <span class="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Duration</span>
                    <span class="font-extrabold text-slate-800">{{ form.value.durationMinutes }} Minutes</span>
                 </div>
                 <div class="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span class="font-extrabold text-slate-900 text-sm uppercase tracking-widest">Total Estimate</span>
                    <span class="text-2xl font-black text-primary-600 tracking-tighter">₹{{ estimatedCost(mentor.hourlyRate) | number:'1.0-0' }}</span>
                 </div>
              </div>

              <div class="p-4 bg-emerald-50 rounded-2xl flex items-center gap-3">
                 <span class="material-icons text-emerald-500 text-sm">security</span>
                 <p class="text-[9px] font-bold text-emerald-700 uppercase tracking-[0.15em] leading-tight">Secure Payment: You'll only be charged after the mentor accepts the session.</p>
              </div>
            </div>
          } @else {
            <div class="glass-card p-10 h-80 flex flex-col items-center justify-center gap-4 animate-pulse">
               <div class="w-20 h-20 bg-slate-100 rounded-[2.5rem]"></div>
               <div class="w-32 h-4 bg-slate-100 rounded-full"></div>
            </div>
          }
        </div>

        <!-- Right: Form Area -->
        <div class="lg:col-span-8">
          <div class="glass-card p-8 md:p-12 border border-slate-100 shadow-sm animate-drop-in" style="animation-delay: 0.1s">
            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-10">
              
              <!-- Section: Topic -->
              <div class="space-y-6">
                <div class="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <span class="material-icons text-primary-600">tips_and_updates</span>
                  <h3 class="text-sm font-bold uppercase tracking-widest text-slate-800">Focus Area</h3>
                </div>

                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">What do you want to learn? <span class="text-red-400">*</span></label>
                  <div class="relative group">
                    <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors">auto_stories</span>
                    <select formControlName="skillId" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-bold text-slate-700 cursor-pointer appearance-none">
                      <option [ngValue]="null" disabled>Select Specific Expertise...</option>
                      @for (cat of skillStore.groupedByCategory(); track cat.category) {
                        <optgroup [label]="cat.category">
                          @for (s of cat.skills; track s.id) {
                            <option [ngValue]="s.id">{{ s.name }}</option>
                          }
                        </optgroup>
                      }
                    </select>
                  </div>
                </div>
              </div>

              <!-- Section: Schedule -->
              <div class="space-y-6">
                <div class="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <span class="material-icons text-primary-600">event</span>
                  <h3 class="text-sm font-bold uppercase tracking-widest text-slate-800">Pick a Time</h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-1.5">
                    <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Date</label>
                    <div class="relative group">
                      <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors">calendar_month</span>
                      <input type="date" formControlName="scheduledDate" [min]="today" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-bold text-slate-700 cursor-pointer">
                    </div>
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Time (IST)</label>
                    <div class="relative group">
                      <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors">schedule</span>
                      <input type="time" formControlName="scheduledTime" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 outline-none transition-all font-bold text-slate-700 cursor-pointer">
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section: Duration -->
              <div class="space-y-6">
                <div class="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <span class="material-icons text-primary-600">av_timer</span>
                  <h3 class="text-sm font-bold uppercase tracking-widest text-slate-800">Session Length</h3>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  @for (d of durations; track d.value) {
                    <button type="button" 
                      (click)="form.patchValue({ durationMinutes: d.value })"
                      [class.bg-primary-600]="form.value.durationMinutes === d.value"
                      [class.text-white]="form.value.durationMinutes === d.value"
                      [class.shadow-xl]="form.value.durationMinutes === d.value"
                      [class.shadow-primary-200]="form.value.durationMinutes === d.value"
                      [class.bg-slate-50]="form.value.durationMinutes !== d.value"
                      [class.text-slate-500]="form.value.durationMinutes !== d.value"
                      class="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 transition-all duration-300 active:scale-95 space-y-1 group">
                      <span class="text-sm font-black">{{ d.label }}</span>
                      <span class="text-[9px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">{{ d.sub }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Submit Footer -->
              <div class="pt-10 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div class="flex items-center gap-4 text-slate-400">
                    <span class="material-icons">help_outline</span>
                    <p class="text-[10px] font-bold uppercase tracking-widest max-w-[200px]">Mentor will have 24 hours to accept or decline.</p>
                 </div>
                 
                 <div class="flex gap-4 w-full md:w-auto">
                    <button type="button" (click)="back()" class="flex-1 md:flex-none px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                    <button type="submit" [disabled]="form.invalid || sessionStore.loading()" 
                            class="flex-1 md:flex-none bg-primary-600 text-white rounded-2xl px-12 py-4 font-bold shadow-2xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                       @if (sessionStore.loading()) {
                         <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       } @else {
                         <span class="material-icons text-base">send</span>
                         <span>Request Session</span>
                       }
                    </button>
                 </div>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  `
})
export class RequestSessionPage implements OnInit {
  readonly sessionStore = inject(SessionStore) as any;
  readonly mentorStore = inject(MentorStore) as any;
  readonly skillStore = inject(SkillStore) as any;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly today = new Date().toISOString().split('T')[0];

  readonly durations = [
    { label: '30m', value: 30,  sub: '₹ × 0.5' },
    { label: '60m', value: 60,  sub: '₹ × 1.0' },
    { label: '90m', value: 90,  sub: '₹ × 1.5' },
    { label: '2hr', value: 120, sub: '₹ × 2.0' },
  ];

  readonly form = this.fb.group({
    skillId:        [null as number | null, [Validators.required, Validators.min(1)]],
    scheduledDate:  ['', Validators.required],
    scheduledTime:  ['', Validators.required],
    durationMinutes:[60, Validators.required]
  });

  ngOnInit(): void {
    patchState(this.sessionStore, { error: null });
    const mentorId = Number(this.route.snapshot.queryParamMap.get('mentorId'));
    if (mentorId) this.mentorStore.loadById(mentorId);
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }
  }

  estimatedCost(hourlyRate: number): number {
    const mins = this.form.value.durationMinutes ?? 60;
    return (hourlyRate / 60) * mins;
  }

  submit(): void {
    if (this.form.invalid) return;
    const mentorId = Number(this.route.snapshot.queryParamMap.get('mentorId'));
    const { skillId, scheduledDate, scheduledTime, durationMinutes } = this.form.getRawValue();
    const date = new Date(`${scheduledDate}T${scheduledTime}:00`);

    this.sessionStore.requestSession({
      mentorId,
      skillId: skillId!,
      scheduledAt: date.toISOString(),
      durationMinutes: durationMinutes!
    });

    setTimeout(() => {
      if (!this.sessionStore.error()) {
        this.router.navigate(['/sessions']);
      }
    }, 1000);
  }

  back(): void { this.router.navigate(['/mentors']); }
  
  mentorInitials(): string {
    const m = this.mentorStore.selected();
    if (!m) return 'M';
    const name = (m.name || m.username || '') as string;
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
