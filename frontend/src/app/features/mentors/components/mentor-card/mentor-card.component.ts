import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MentorProfileDto } from '../../../../shared/models';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-mentor-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" (click)="view.emit(mentor.id)">
      <div class="card-top">
        <div class="avatar">{{ initials() }}</div>
        <div class="avail-badge" [class]="'avail-' + mentor.availabilityStatus.toLowerCase()">
          <span class="dot"></span>{{ mentor.availabilityStatus }}
        </div>
      </div>

      <div class="card-body">
        <h3 class="specialization">{{ mentor.specialization }}</h3>
        <p class="experience">{{ mentor.yearsOfExperience }} years of experience</p>

        <div class="stats">
          <div class="stat">
            <span class="material-icons stat-icon">star</span>
            <span class="stat-val">{{ mentor.rating | number:'1.1-1' }}</span>
          </div>
          <div class="stat">
            <span class="material-icons stat-icon">people</span>
            <span class="stat-val">{{ mentor.totalStudents }}</span>
          </div>
          <div class="stat">
            <span class="material-icons stat-icon">payments</span>
            <span class="stat-val">₹{{ mentor.hourlyRate }}/hr</span>
          </div>
        </div>
      </div>

      <div class="card-actions">
        @if (isOwnProfile()) {
          <!-- Own profile: single full-width manage button -->
          <button class="btn-manage" (click)="$event.stopPropagation(); view.emit(mentor.id)">
            <span class="material-icons">settings</span> Manage Profile
          </button>
        } @else {
          <!-- Other mentor: book + view -->
          <button class="btn-book"
                  (click)="$event.stopPropagation(); book.emit(mentor.id)"
                  [disabled]="mentor.availabilityStatus !== 'AVAILABLE'">
            Book Session
          </button>
          <button class="btn-view" (click)="$event.stopPropagation(); view.emit(mentor.id)">
            View Profile
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .card {
      background: white; border-radius: 16px;
      border: 1px solid #e5e7eb;
      padding: 20px; cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
      display: flex; flex-direction: column; gap: 16px;
    }
    .card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(79,70,229,0.12); border-color: #c7d2fe; }

    .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .avatar {
      width: 52px; height: 52px; border-radius: 14px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; font-size: 18px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    .avail-badge {
      display: flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; }
    .avail-available { background: #dcfce7; color: #16a34a; }
    .avail-available .dot { background: #16a34a; }
    .avail-busy { background: #fef3c7; color: #d97706; }
    .avail-busy .dot { background: #d97706; }
    .avail-unavailable { background: #fee2e2; color: #dc2626; }
    .avail-unavailable .dot { background: #dc2626; }

    .card-body { flex: 1; }
    .specialization { font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 4px; }
    .experience { font-size: 13px; color: #6b7280; margin: 0 0 14px; }

    .stats { display: flex; gap: 16px; }
    .stat { display: flex; align-items: center; gap: 4px; }
    .stat-icon { font-size: 15px; color: #9ca3af; }
    .stat-val { font-size: 13px; font-weight: 600; color: #374151; }

    .card-actions { display: flex; gap: 8px; align-items: center; }
    .btn-book {
      flex: 1; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; border: none; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: opacity 0.2s;
    }
    .btn-book:hover:not(:disabled) { opacity: 0.88; }
    .btn-book:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-manage {
      width: 100%; height: 40px; border-radius: 10px;
      background: #eef2ff; color: #4f46e5; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: background 0.15s;
    }
    .btn-manage:hover { background: #e0e7ff; }
    .btn-manage .material-icons { font-size: 16px; }

    .btn-view {
      height: 40px; padding: 0 14px; border-radius: 10px;
      background: #f3f4f6; color: #374151; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s;
    }
    .btn-view:hover { background: #e5e7eb; }
  `]
})
export class MentorCardComponent {
  @Input({ required: true }) mentor!: MentorProfileDto;
  @Output() view = new EventEmitter<number>();
  @Output() book = new EventEmitter<number>();

  private readonly authStore = inject(AuthStore);

  // Use method instead of computed() — @Input is not available at computed() init time
  isOwnProfile(): boolean {
    const myId = this.authStore.userId();
    return myId !== null && Number(myId) === Number(this.mentor.userId);
  }

  initials(): string {
    return this.mentor.specialization.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
