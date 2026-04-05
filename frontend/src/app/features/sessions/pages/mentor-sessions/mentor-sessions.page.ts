import 'tslib';
import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { SessionCardComponent } from '../../components/session-card/session-card.component';
import { SessionDto } from '../../../../shared/models';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type DashTab = 'pending' | 'upcoming' | 'all';

@Component({
  selector: 'app-mentor-sessions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SessionCardComponent, MatSnackBarModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20 px-2 lg:px-4">

      <!-- Premium Dashboard Header -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4 border-b border-slate-50">
        <div class="space-y-2">
          <div class="flex items-center gap-3 text-primary-600 font-bold text-xs uppercase tracking-[0.2em] mb-2">
             <span class="material-icons text-sm">verified_user</span>
             Verified Expert Dashboard
          </div>
          <h1 class="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900">Manage Your <span class="text-primary-600">Impact</span></h1>
          <p class="text-slate-500 font-medium text-lg lg:text-xl">Accept requests, track upcoming meetings, and grow your student base.</p>
        </div>

        <div class="flex items-center gap-4">
          <button (click)="refresh()" [disabled]="sessionStore.loading()" class="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary-600 transition-all hover:shadow-lg active:scale-95 group">
             <span class="material-icons" [class.animate-spin]="sessionStore.loading()">refresh</span>
          </button>
          
          <!-- Availability Toggle (Premium) -->
          <button (click)="toggleAvailability()" 
                  class="bg-white border-2 border-slate-100 rounded-3xl px-6 py-3.5 flex items-center gap-4 hover:border-primary-200 transition-all active:scale-95 shadow-sm group">
            <div class="relative">
              <div class="w-3 h-3 rounded-full shadow-sm" [ngClass]="mentorStore.isAvailable() ? 'bg-emerald-500 shadow-emerald-200 animate-pulse' : 'bg-slate-300'"></div>
            </div>
            <div class="text-left">
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">My Status</p>
              <p class="text-xs font-black text-slate-800 uppercase tracking-wider leading-none">{{ mentorStore.isAvailable() ? 'Available' : 'Unavailable' }}</p>
            </div>
            <span class="material-icons text-slate-300 group-hover:text-primary-600 transition-colors">swap_horiz</span>
          </button>
        </div>
      </div>

      <!-- Stats Grid (Glassmorphic) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div (click)="activeTab.set('pending')" 
             [class.ring-2]="activeTab() === 'pending'"
             class="glass-card p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 ring-amber-500/50 ring-offset-2 relative overflow-hidden group">
          <div class="flex items-center gap-4 relative z-10">
            <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-100 transition-colors">
              <span class="material-icons">pending_actions</span>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Action Required</p>
              <p class="text-2xl font-black text-slate-800 tracking-tight">{{ pendingSessions().length }}</p>
            </div>
          </div>
          @if (pendingSessions().length > 0) {
            <span class="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-lg">New Inbound</span>
          }
        </div>

        <div (click)="activeTab.set('upcoming')" 
             [class.ring-2]="activeTab() === 'upcoming'"
             class="glass-card p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 ring-blue-500/50 ring-offset-2 group">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
              <span class="material-icons">event_available</span>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Confirmed</p>
              <p class="text-2xl font-black text-slate-800 tracking-tight">{{ upcomingSessions().length }}</p>
            </div>
          </div>
        </div>

        <div (click)="activeTab.set('all')" 
             [class.ring-2]="activeTab() === 'all'"
             class="glass-card p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 ring-violet-500/50 ring-offset-2 group">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500 group-hover:bg-violet-100 transition-colors">
              <span class="material-icons">history</span>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lifetime</p>
              <p class="text-2xl font-black text-slate-800 tracking-tight">{{ sessionStore.mentorSessions().length }}</p>
            </div>
          </div>
        </div>

        <div class="glass-card p-6 border-emerald-100 bg-emerald-50/5 relative overflow-hidden">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
              <span class="material-icons">account_balance_wallet</span>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Total Confirmed</p>
              <p class="text-2xl font-black text-emerald-700 tracking-tight">{{ confirmedSessions().length }}</p>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
             <span class="material-icons text-8xl text-emerald-600">volunteer_activism</span>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="space-y-8">
        
        <!-- Tab Switches (Premium Pill) -->
        <div class="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
          @for (tab of tabs; track tab.key) {
            <button 
              (click)="activeTab.set(tab.key)"
              [class.bg-white]="activeTab() === tab.key"
              [class.shadow-md]="activeTab() === tab.key"
              [class.text-primary-600]="activeTab() === tab.key"
              [class.text-slate-500]="activeTab() !== tab.key"
              class="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap">
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Dynamic List View -->
        @if (sessionStore.loading()) {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              @for (i of [1,2,3]; track i) {
                <div class="h-64 bg-slate-50 rounded-[2.5rem] animate-pulse"></div>
              }
            </div>
        } @else {
          
          <!-- Special View for Pending to emphasize action -->
          @if (activeTab() === 'pending') {
            <div class="space-y-4 animate-drop-in">
              @for (s of pendingSessions(); track s.id) {
                <div class="glass-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  <div class="flex items-center gap-6">
                    <div class="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                      <span class="material-icons text-3xl">contact_support</span>
                    </div>
                    <div class="space-y-2">
                      <div class="flex gap-2">
                         <span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest">New Booking Request</span>
                         <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-0.5">Session #{{ s.id }}</span>
                      </div>
                      <h4 class="text-xl font-black text-slate-800 tracking-tight leading-none">{{ getSkillName(s.skillId) }}</h4>
                      <div class="flex items-center gap-4 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                         <span class="flex items-center gap-1"><span class="material-icons text-sm">calendar_month</span> {{ s.scheduledAt | date:'EEE, MMM d' }}</span>
                         <span class="flex items-center gap-1"><span class="material-icons text-sm">schedule</span> {{ s.scheduledAt | date:'h:mm a' }}</span>
                         <span class="flex items-center gap-1 text-slate-300 flex-shrink-0">•</span>
                         <span class="flex items-center gap-1"><span class="material-icons text-sm">timer</span> {{ s.durationMinutes }} Min</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                    <button (click)="openReject(s)" class="flex-1 md:flex-none px-6 py-3 rounded-xl border border-red-100 text-red-500 text-xs font-extrabold uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95">Decline</button>
                    <button (click)="accept(s.id)" class="flex-[2] md:flex-none px-10 py-3 bg-emerald-600 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2">
                       <span class="material-icons text-base">verified</span>
                       Accept Session
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="py-24 glass-card border border-dashed border-slate-200 flex flex-col items-center text-center space-y-4">
                   <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <span class="material-icons text-3xl">inbox</span>
                   </div>
                   <h3 class="text-xl font-bold text-slate-800">No pending requests</h3>
                   <p class="text-slate-500 text-sm max-w-xs font-medium">When learners book sessions with you, they'll appear here for your approval.</p>
                </div>
              }
            </div>
          } @else {
            <!-- Regular Grid for Other Tabs -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-drop-in">
              @for (s of (activeTab() === 'upcoming' ? upcomingSessions() : sessionStore.mentorSessions()); track s.id) {
                <app-session-card 
                  [session]="s"
                  (view)="router.navigate(['/sessions', $event])"
                  (cancel)="cancelSession($event)"
                  (pay)="noop()" />
              } @empty {
                <div class="col-span-full py-24 flex flex-col items-center text-center space-y-4 text-slate-300">
                   <span class="material-icons text-6xl">event_busy</span>
                   <p class="text-sm font-bold uppercase tracking-widest">No matching activities found.</p>
                </div>
              }
            </div>
          }

        }

      </div>
    </div>

    <!-- Rejection Modal (Premium Backdrop) -->
    @if (rejectingSession()) {
      <div class="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="rejectingSession.set(null)"></div>
        
        <div class="bg-white rounded-[2.5rem] w-full max-w-lg p-10 relative z-10 shadow-2xl animate-drop-in border border-slate-100">
           <div class="flex items-center gap-4 mb-8">
              <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                 <span class="material-icons">block</span>
              </div>
              <div class="space-y-0.5">
                 <h2 class="text-xl font-black text-slate-800 tracking-tight">Decline Session Request</h2>
                 <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Session #{{ rejectingSession()!.id }}</p>
              </div>
           </div>

           <p class="text-sm text-slate-500 font-medium leading-relaxed mb-8 italic">Let the learner know why you are unable to fulfill this request. This keeps our community transparent and helpful.</p>

           <!-- Quick Reasons Chips -->
           <div class="flex flex-wrap gap-2 mb-8">
             @for (r of quickReasons; track r) {
               <button 
                 (click)="rejectReason = r"
                 [class.bg-red-500]="rejectReason === r"
                 [class.text-white]="rejectReason === r"
                 [class.ring-4]="rejectReason === r"
                 [class.ring-red-100]="rejectReason === r"
                 [class.bg-slate-50]="rejectReason !== r"
                 [class.text-slate-500]="rejectReason !== r"
                 class="px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95">
                 {{ r }}
               </button>
             }
           </div>

           <!-- Custom Input -->
           <div class="relative group mb-10">
              <span class="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors">edit_note</span>
              <input type="text" [(ngModel)]="rejectReason" placeholder="Or provide a custom reason..." class="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500/50 outline-none transition-all font-bold text-slate-700">
           </div>

           <div class="flex gap-4">
              <button (click)="rejectingSession.set(null)" class="flex-1 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel Interaction</button>
              <button 
                 (click)="confirmReject()" 
                 [disabled]="!rejectReason.trim()"
                 class="flex-[2] bg-red-600 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                 Confirm Rejection
              </button>
           </div>
        </div>
      </div>
    }
  `
})
export class MentorSessionsPage implements OnInit {
  readonly sessionStore = inject(SessionStore) as any;
  readonly mentorStore = inject(MentorStore) as any;
  readonly authStore = inject(AuthStore) as any;
  readonly skillStore = inject(SkillStore) as any;
  readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  constructor() {
    effect(() => {
      const profile = this.mentorStore.myProfile();
      if (profile && !this.authStore.isMentor()) {
        this.authStore.refreshToken(undefined);
      }
    }, { allowSignalWrites: false });
  }

  readonly activeTab = signal<DashTab>('pending');
  readonly rejectingSession = signal<SessionDto | null>(null);
  rejectReason = '';

  readonly tabs: { key: DashTab; label: string }[] = [
    { key: 'pending',  label: 'Incoming Requests' },
    { key: 'upcoming', label: 'Accepted Schedule' },
    { key: 'all',      label: 'Session History' },
  ];

  readonly quickReasons = [
    'Schedule Conflict',
    'Personal Emergency',
    'Topic Misaligned',
    'Full Capacity',
  ];

  readonly pendingSessions = computed(() =>
    (this.sessionStore.mentorSessions() as SessionDto[]).filter(s => s.status === 'REQUESTED')
  );
  readonly upcomingSessions = computed(() =>
    (this.sessionStore.mentorSessions() as SessionDto[]).filter(s =>
      ['ACCEPTED', 'CONFIRMED'].includes(s.status) &&
      new Date(s.scheduledAt) > new Date()
    )
  );
  readonly confirmedSessions = computed(() =>
    (this.sessionStore.mentorSessions() as SessionDto[]).filter(s => s.status === 'CONFIRMED')
  );

  ngOnInit(): void {
    this.refresh();
    this.mentorStore.loadMyProfile(undefined);
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }
  }

  getSkillName(id: number): string {
    const s = this.skillStore.getSkillById(id);
    return s ? (s.skillName || s.name) : ('Skill #' + id);
  }

  refresh(): void {
    this.sessionStore.loadMentorSessions(undefined);
  }

  toggleAvailability(): void {
    if (!this.authStore.isMentor()) {
      this.authStore.refreshToken(undefined);
      return;
    }
    const next = this.mentorStore.isAvailable() ? 'BUSY' : 'AVAILABLE';
    this.mentorStore.updateAvailability({ availabilityStatus: next as any });
  }

  accept(id: number): void {
    this.sessionStore.accept(id);
  }

  openReject(s: SessionDto): void { this.rejectingSession.set(s); this.rejectReason = ''; }

  confirmReject(): void {
    const s = this.rejectingSession();
    if (!s || !this.rejectReason.trim()) return;
    this.sessionStore.reject({ id: s.id, reason: this.rejectReason });
    this.rejectingSession.set(null);
  }

  cancelSession(id: number): void {
    this.sessionStore.cancel(id);
  }

  noop(): void {}
}
