import 'tslib';
import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionDto } from '../../../../shared/models';
import { SkillStore } from '../../../../core/auth/skill.store';
import { AuthStore } from '../../../../core/auth/auth.store';

const STATUS_MAP: Record<string, { color: string; bg: string; icon: string; label: string; ring: string }> = {
  REQUESTED:      { color: 'text-amber-600',  bg: 'bg-amber-50',    icon: 'hourglass_empty',  label: 'Requested',       ring: 'ring-amber-500/20' },
  ACCEPTED:       { color: 'text-blue-600',   bg: 'bg-blue-50',     icon: 'verified',         label: 'Accepted',        ring: 'ring-blue-500/20' },
  CONFIRMED:      { color: 'text-emerald-600',bg: 'bg-emerald-50',  icon: 'check_circle',     label: 'Confirmed',       ring: 'ring-emerald-500/20' },
  REJECTED:       { color: 'text-red-600',    bg: 'bg-red-50',      icon: 'cancel',           label: 'Rejected',        ring: 'ring-red-500/20' },
  CANCELLED:      { color: 'text-slate-500',  bg: 'bg-slate-50',    icon: 'block',            label: 'Cancelled',       ring: 'ring-slate-500/20' },
  PAYMENT_FAILED: { color: 'text-red-600',    bg: 'bg-red-50',      icon: 'error_outline',    label: 'Payment Failed',  ring: 'ring-red-500/20' },
  REFUNDED:       { color: 'text-violet-600', bg: 'bg-violet-50',   icon: 'replay',           label: 'Refunded',        ring: 'ring-violet-500/20' },
};

@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="group bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-primary-600/10 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between h-full">
      
      <!-- Top Section -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div [class]="s.bg + ' ' + s.color + ' w-10 h-10 rounded-xl flex items-center justify-center shadow-sm'">
              <span class="material-icons text-xl">{{ s.icon }}</span>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Session ID</p>
              <p class="text-sm font-extrabold text-slate-800 tracking-tight">#{{ session.id }}</p>
            </div>
          </div>
          <div [class]="s.bg + ' ' + s.color + ' ' + s.ring + ' px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 flex items-center gap-1.5'">
             <span class="w-1.5 h-1.5 rounded-full bg-current" [class.animate-pulse]="session.status === 'REQUESTED' || session.status === 'ACCEPTED'"></span>
             {{ s.label }}
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center gap-3 text-slate-600">
             <span class="material-icons-outlined text-lg text-slate-300">event</span>
             <p class="text-sm font-medium tracking-tight">{{ session.scheduledAt | date:'MMM d, y · h:mm a' }}</p>
          </div>
          <div class="flex items-center gap-3 text-slate-600">
             <span class="material-icons-outlined text-lg text-slate-300">school</span>
             <p class="text-sm font-bold tracking-tight text-slate-800 uppercase text-xs">{{ skillName }}</p>
          </div>
          <div class="flex items-center gap-3 text-slate-600">
             <span class="material-icons-outlined text-lg text-slate-300">person_outline</span>
             <p class="text-sm font-medium tracking-tight">{{ session.mentorName || ('Mentor #' + session.mentorId) }}</p>
          </div>
        </div>

        <!-- Status Context Message -->
        @if (session.status === 'REQUESTED' && isLearner) {
           <div class="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center gap-3 animate-pulse">
              <span class="material-icons text-amber-500 text-sm">hourglass_top</span>
              <p class="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Waiting for Approval</p>
           </div>
        }
        @if (session.status === 'ACCEPTED' && isLearner) {
           <div class="p-4 bg-primary-50/50 rounded-2xl border border-primary-100 flex items-center gap-3 animate-bounce-subtle">
              <span class="material-icons text-primary-600 text-sm">payments</span>
              <p class="text-[10px] font-bold text-primary-700 uppercase tracking-widest">Action Required: Pay Now</p>
           </div>
        }
      </div>

      <!-- Action Section -->
      <div class="pt-6 mt-6 border-t border-slate-50 flex gap-2">
         <button (click)="view.emit(session.id)" class="flex-1 bg-slate-50 text-slate-600 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all">Details</button>
         
         @if (session.status === 'ACCEPTED' && isLearner) {
           <button (click)="pay.emit(session.id)" class="flex-[2] bg-primary-600 text-white rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary-200 hover:bg-primary-700 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2">
              <span class="material-icons text-sm">payment</span>
              Pay Now
           </button>
         }
         
         @if (session.status === 'REQUESTED' || session.status === 'ACCEPTED') {
           <button (click)="cancel.emit(session.id)" class="px-4 text-red-400 hover:text-red-600 transition-colors">
              <span class="material-icons text-sm">delete_outline</span>
           </button>
         }
      </div>

    </div>

    <style>
      @keyframes bounce-subtle {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      .animate-bounce-subtle {
        animation: bounce-subtle 2s infinite ease-in-out;
      }
    </style>
  `
})
export class SessionCardComponent {
  @Input({ required: true }) session!: SessionDto;
  @Output() view = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<number>();
  @Output() pay = new EventEmitter<number>();

  private readonly skillStore = inject(SkillStore) as any;
  private readonly authStore = inject(AuthStore) as any;

  get isLearner(): boolean {
    return Number(this.authStore.userId()) === Number(this.session.learnerId);
  }

  get skillName(): string {
    const s = this.skillStore.getSkillById(this.session.skillId);
    return s ? (s.skillName || s.name) : ('Skill #' + this.session.skillId);
  }

  get s() { return STATUS_MAP[this.session.status] ?? STATUS_MAP['CANCELLED']; }
}
