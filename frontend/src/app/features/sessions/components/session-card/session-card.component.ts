import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionDto } from '../../../../shared/models';
import { SkillStore } from '../../../../core/store/skill.store';
import { AuthStore } from '../../../../core/store/auth.store';

const STATUS_MAP: Record<string, { color: string; bg: string; icon: string; label: string; ring: string }> = {
  REQUESTED:      { color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',    icon: 'hourglass_empty',  label: 'Requested',       ring: 'ring-amber-500/20' },
  ACCEPTED:       { color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20',     icon: 'verified',         label: 'Accepted',        ring: 'ring-blue-500/20' },
  CONFIRMED:      { color: 'text-emerald-600 dark:text-emerald-400',bg: 'bg-emerald-50 dark:bg-emerald-900/20',  icon: 'check_circle',     label: 'Confirmed',       ring: 'ring-emerald-500/20' },
  REJECTED:       { color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20',      icon: 'cancel',           label: 'Rejected',        ring: 'ring-red-500/20' },
  CANCELLED:      { color: 'text-slate-500 dark:text-slate-400',  bg: 'bg-slate-50 dark:bg-slate-800/50',    icon: 'block',            label: 'Cancelled',       ring: 'ring-slate-500/20' },
  PAYMENT_FAILED: { color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20',      icon: 'error_outline',    label: 'Payment Failed',  ring: 'ring-red-500/20' },
  REFUNDED:       { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20',   icon: 'replay',           label: 'Refunded',        ring: 'ring-violet-500/20' },
};

@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-card.component.html',
  styleUrl: './session-card.component.scss'
})
export class SessionCardComponent {
  @Input({ required: true }) session!: SessionDto;
  @Output() view = new EventEmitter<number>();
  @Output() cancelSession = new EventEmitter<number>();
  @Output() pay = new EventEmitter<number>();

  private readonly skillStore = inject(SkillStore);
  private readonly authStore = inject(AuthStore);

  get isLearner(): boolean {
    return Number(this.authStore.userId()) === Number(this.session.learnerId);
  }

  get skillName(): string {
    const s = this.skillStore.getSkillById(this.session.skillId);
    return s?.skillName ? s.skillName : ('Skill #' + this.session.skillId);
  }

  get s() { return STATUS_MAP[this.session.status] ?? STATUS_MAP['CANCELLED']; }
  
  get scheduledAtUtc(): string {
    if (!this.session.scheduledAt) return '';
    return this.session.scheduledAt.endsWith('Z') || this.session.scheduledAt.includes('+') 
      ? this.session.scheduledAt 
      : this.session.scheduledAt + 'Z';
  }
}
