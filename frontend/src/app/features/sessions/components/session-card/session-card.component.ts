import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionDto } from '../../../../shared/models';

const STATUS: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  REQUESTED:      { color: '#d97706', bg: '#fef3c7', icon: 'schedule',      label: 'Requested' },
  ACCEPTED:       { color: '#2563eb', bg: '#dbeafe', icon: 'thumb_up',      label: 'Accepted' },
  CONFIRMED:      { color: '#16a34a', bg: '#dcfce7', icon: 'check_circle',  label: 'Confirmed' },
  REJECTED:       { color: '#dc2626', bg: '#fee2e2', icon: 'cancel',        label: 'Rejected' },
  CANCELLED:      { color: '#6b7280', bg: '#f3f4f6', icon: 'block',         label: 'Cancelled' },
  PAYMENT_FAILED: { color: '#dc2626', bg: '#fee2e2', icon: 'payment',       label: 'Payment Failed' },
  REFUNDED:       { color: '#7c3aed', bg: '#ede9fe', icon: 'replay',        label: 'Refunded' },
};

@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-top">
        <div class="session-icon" [style.background]="s().bg">
          <span class="material-icons" [style.color]="s().color">{{ s().icon }}</span>
        </div>
        <div class="session-info">
          <span class="session-id">Session #{{ session.id }}</span>
          <span class="session-date">{{ session.scheduledAt | date:'MMM d, y · h:mm a' }}</span>
        </div>
        <div class="status-badge" [style.background]="s().bg" [style.color]="s().color">
          {{ s().label }}
        </div>
      </div>

      <div class="card-meta">
        <div class="meta-item">
          <span class="material-icons">timer</span>
          {{ session.durationMinutes }} min
        </div>
        <div class="meta-item">
          <span class="material-icons">person</span>
          Mentor #{{ session.mentorId }}
        </div>
        <div class="meta-item">
          <span class="material-icons">auto_stories</span>
          Skill #{{ session.skillId }}
        </div>
      </div>

      @if (session.rejectionReason) {
        <div class="rejection-note">
          <span class="material-icons">info</span>
          {{ session.rejectionReason }}
        </div>
      }

      <div class="card-actions">
        <button class="btn-details" (click)="view.emit(session.id)">View Details</button>
        @if (session.status === 'ACCEPTED') {
          <button class="btn-pay" (click)="pay.emit(session.id)">
            <span class="material-icons">payment</span> Pay Now
          </button>
        }
        @if (session.status === 'REQUESTED' || session.status === 'ACCEPTED') {
          <button class="btn-cancel" (click)="cancel.emit(session.id)">Cancel</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .card { background: white; border-radius: 16px; border: 1px solid #e5e7eb; padding: 18px; display: flex; flex-direction: column; gap: 14px; transition: box-shadow 0.2s, border-color 0.2s; }
    .card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-color: #c7d2fe; }

    .card-top { display: flex; align-items: center; gap: 12px; }
    .session-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .session-icon .material-icons { font-size: 22px; }
    .session-info { flex: 1; min-width: 0; }
    .session-id { display: block; font-size: 15px; font-weight: 700; color: #111827; }
    .session-date { display: block; font-size: 12px; color: #6b7280; margin-top: 2px; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }

    .card-meta { display: flex; gap: 16px; flex-wrap: wrap; }
    .meta-item { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #6b7280; }
    .meta-item .material-icons { font-size: 15px; color: #9ca3af; }

    .rejection-note { display: flex; align-items: flex-start; gap: 8px; background: #fef2f2; color: #dc2626; padding: 10px 12px; border-radius: 10px; font-size: 13px; }
    .rejection-note .material-icons { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

    .card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-details { height: 36px; padding: 0 14px; border-radius: 8px; background: #f3f4f6; color: #374151; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    .btn-details:hover { background: #e5e7eb; }
    .btn-pay { height: 36px; padding: 0 14px; border-radius: 8px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; }
    .btn-pay .material-icons { font-size: 15px; }
    .btn-cancel { height: 36px; padding: 0 14px; border-radius: 8px; background: #fee2e2; color: #dc2626; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    .btn-cancel:hover { background: #fecaca; }
  `]
})
export class SessionCardComponent {
  @Input({ required: true }) session!: SessionDto;
  @Output() view = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<number>();
  @Output() pay = new EventEmitter<number>();
  s() { return STATUS[this.session.status] ?? STATUS['CANCELLED']; }
}
