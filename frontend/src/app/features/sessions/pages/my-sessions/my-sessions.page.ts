import 'tslib';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionStore } from '../../../../core/auth/session.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { SessionCardComponent } from '../../components/session-card/session-card.component';
import { SessionDto } from '../../../../shared/models';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

@Component({
  selector: 'app-my-sessions-page',
  standalone: true,
  imports: [CommonModule, SessionCardComponent],
  template: `
    <div class="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20 px-2 lg:px-4">

      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-2">
          <h1 class="text-4xl font-extrabold tracking-tight text-slate-900">My <span class="text-primary-600">Learning</span> Sessions</h1>
          <p class="text-slate-500 font-medium text-lg">Track your progress and upcoming mentorship meetings.</p>
        </div>
        <button 
          (click)="router.navigate(['/mentors'])"
          class="bg-primary-600 text-white rounded-2xl px-8 py-4 font-bold shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2">
          <span class="material-icons text-xl">add_circle</span>
          Book New Session
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div (click)="activeTab.set('all')" 
             [class.ring-2]="activeTab() === 'all'"
             class="glass-card p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 ring-primary-500 ring-offset-2">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
              <span class="material-icons">event</span>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
              <p class="text-2xl font-extrabold text-slate-800 tracking-tight">{{ sessionStore.learnerSessions().length }}</p>
            </div>
          </div>
        </div>
        <div (click)="activeTab.set('active')" 
             [class.ring-2]="activeTab() === 'active'"
             class="glass-card p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 ring-blue-500 ring-offset-2">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
              <span class="material-icons">bolt</span>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active</p>
              <p class="text-2xl font-extrabold text-blue-600 tracking-tight">{{ activeCount() }}</p>
            </div>
          </div>
        </div>
        <div (click)="activeTab.set('completed')" 
             [class.ring-2]="activeTab() === 'completed'"
             class="glass-card p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 ring-emerald-500 ring-offset-2">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
              <span class="material-icons">check_circle</span>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Done</p>
              <p class="text-2xl font-extrabold text-emerald-600 tracking-tight">{{ completedCount() }}</p>
            </div>
          </div>
        </div>
        <div (click)="activeTab.set('cancelled')" 
             [class.ring-2]="activeTab() === 'cancelled'"
             class="glass-card p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 ring-red-500 ring-offset-2">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
              <span class="material-icons">cancel</span>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cancelled</p>
              <p class="text-2xl font-extrabold text-red-600 tracking-tight">{{ cancelledCount() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="space-y-6">
        
        <!-- Filter Bar -->
        <div class="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
          @for (tab of tabs; track tab.key) {
            <button 
              (click)="activeTab.set(tab.key)"
              [class.bg-white]="activeTab() === tab.key"
              [class.shadow-md]="activeTab() === tab.key"
              [class.text-primary-600]="activeTab() === tab.key"
              [class.text-slate-500]="activeTab() !== tab.key"
              class="px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 whitespace-nowrap">
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Session List / Grid -->
        @if (sessionStore.loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (i of [1,2,3]; track i) {
              <div class="h-64 bg-slate-100 rounded-[2.5rem] animate-pulse"></div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (s of filteredSessions(); track s.id) {
              <app-session-card 
                [session]="s"
                (view)="router.navigate(['/sessions', $event])"
                (cancel)="sessionStore.cancel($event)"
                (pay)="router.navigate(['/payment'], { queryParams: { sessionId: $event } })" />
            }
            @empty {
              <div class="col-span-full py-20 flex flex-col items-center justify-center text-center animate-drop-in">
                <div class="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6">
                  <span class="material-icons text-6xl">{{ emptyIcon() }}</span>
                </div>
                <h3 class="text-2xl font-bold text-slate-800">{{ emptyTitle() }}</h3>
                <p class="text-slate-500 max-w-sm mt-2 font-medium">{{ emptyDesc() }}</p>
                @if (activeTab() === 'all') {
                  <button (click)="router.navigate(['/mentors'])" class="mt-8 px-8 py-3 bg-primary-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg transition-all active:scale-95">Find Your First Mentor</button>
                }
              </div>
            }
          </div>
        }

      </div>
    </div>
  `
})
export class MySessionsPage implements OnInit {
  readonly sessionStore = inject(SessionStore) as any;
  readonly skillStore = inject(SkillStore) as any;
  readonly router = inject(Router);

  readonly activeTab = signal<FilterTab>('all');

  readonly tabs: { key: FilterTab; label: string }[] = [
    { key: 'all',       label: 'All Sessions' },
    { key: 'active',    label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  ngOnInit(): void { 
    this.sessionStore.loadLearnerSessions(undefined); 
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }
  }

  // Computed counts for better performance
  activeCount = computed(() => (this.sessionStore.learnerSessions() as SessionDto[]).filter(s => ['REQUESTED','ACCEPTED','CONFIRMED'].includes(s.status)).length);
  completedCount = computed(() => (this.sessionStore.learnerSessions() as SessionDto[]).filter(s => s.status === 'CONFIRMED').length);
  cancelledCount = computed(() => (this.sessionStore.learnerSessions() as SessionDto[]).filter(s => ['CANCELLED','REJECTED','PAYMENT_FAILED'].includes(s.status)).length);

  filteredSessions(): SessionDto[] {
    const all = this.sessionStore.learnerSessions() as SessionDto[];
    switch (this.activeTab()) {
      case 'active':    return all.filter(s => ['REQUESTED','ACCEPTED','CONFIRMED'].includes(s.status));
      case 'completed': return all.filter(s => s.status === 'CONFIRMED');
      case 'cancelled': return all.filter(s => ['CANCELLED','REJECTED','PAYMENT_FAILED'].includes(s.status));
      default:          return all;
    }
  }

  emptyIcon(): string {
    const icons: Record<FilterTab, string> = { all: 'event_note', active: 'auto_fix_off', completed: 'assignment_turned_in', cancelled: 'event_busy' };
    return icons[this.activeTab()];
  }

  emptyTitle(): string {
    const titles: Record<FilterTab, string> = { all: 'No sessions recorded', active: 'No ongoing sessions', completed: 'No completed goals', cancelled: 'No cancelled sessions' };
    return titles[this.activeTab()];
  }

  emptyDesc(): string {
    const descs: Record<FilterTab, string> = {
      all: 'Your journey starts here. Book a session with a top-tier mentor to accelerate your growth.',
      active: 'You are all caught up! Browse upcoming slots or reach out to mentors.',
      completed: 'Once you finish your first session, it will appear here for review.',
      cancelled: 'Good news! You have no cancelled or rejected sessions.'
    };
    return descs[this.activeTab()];
  }
}
