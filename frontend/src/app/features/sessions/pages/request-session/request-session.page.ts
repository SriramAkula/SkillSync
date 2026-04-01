import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SessionStore } from '../../../../core/auth/session.store';
import { MentorStore } from '../../../../core/auth/mentor.store';

@Component({
  selector: 'app-request-session-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page">
      <button class="back-btn" (click)="back()">
        <span class="material-icons">arrow_back</span> Back to Mentors
      </button>

      <div class="layout">

        <!-- Left: Mentor Preview -->
        <div class="mentor-col">
          @if (mentorStore.selected(); as mentor) {
            <div class="mentor-card">
              <div class="mentor-avatar">{{ initials(mentor.specialization) }}</div>
              <h3>{{ mentor.specialization }}</h3>
              <p class="mentor-exp">{{ mentor.yearsOfExperience }} years experience</p>
              <div class="mentor-stats">
                <div class="stat"><span class="material-icons">star</span>{{ mentor.rating | number:'1.1-1' }}</div>
                <div class="stat"><span class="material-icons">payments</span>₹{{ mentor.hourlyRate }}/hr</div>
              </div>
              <div class="avail-badge" [class]="'avail-' + mentor.availabilityStatus.toLowerCase()">
                <span class="dot"></span>{{ mentor.availabilityStatus }}
              </div>
            </div>

            <!-- Cost Estimator -->
            <div class="cost-card">
              <h4>Cost Estimate</h4>
              <div class="cost-row">
                <span>Duration</span>
                <span>{{ form.value.durationMinutes }} min</span>
              </div>
              <div class="cost-row">
                <span>Rate</span>
                <span>₹{{ mentor.hourlyRate }}/hr</span>
              </div>
              <div class="cost-divider"></div>
              <div class="cost-row total">
                <span>Total</span>
                <span>₹{{ estimatedCost(mentor.hourlyRate) | number:'1.2-2' }}</span>
              </div>
            </div>
          } @else {
            <div class="mentor-card skeleton">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-line w60"></div>
              <div class="skeleton-line w40"></div>
            </div>
          }
        </div>

        <!-- Right: Booking Form -->
        <div class="form-col">
          <div class="form-card">
            <h2>Book a Session</h2>
            <p class="form-subtitle">Fill in the details to request your session</p>

            <form [formGroup]="form" (ngSubmit)="submit()" class="form">

              <!-- Skill ID -->
              <div class="input-group">
                <label class="input-label">Skill ID <span class="required">*</span></label>
                <div class="input-wrapper" [class.focused]="focused() === 'skill'"
                     [class.error]="form.get('skillId')?.invalid && form.get('skillId')?.touched">
                  <span class="material-icons input-icon">auto_stories</span>
                  <input type="number" formControlName="skillId" placeholder="Enter skill ID"
                    (focus)="focused.set('skill')" (blur)="focused.set('')" />
                </div>
                @if (form.get('skillId')?.invalid && form.get('skillId')?.touched) {
                  <span class="field-error">Valid skill ID is required</span>
                }
              </div>

              <!-- Date + Time row -->
              <div class="date-time-row">
                <div class="input-group">
                  <label class="input-label">Date <span class="required">*</span></label>
                  <div class="input-wrapper" [class.focused]="focused() === 'date'">
                    <span class="material-icons input-icon">calendar_today</span>
                    <input type="date" formControlName="scheduledDate"
                      [min]="today"
                      (focus)="focused.set('date')" (blur)="focused.set('')" />
                  </div>
                </div>

                <div class="input-group">
                  <label class="input-label">Time <span class="required">*</span></label>
                  <div class="input-wrapper" [class.focused]="focused() === 'time'">
                    <span class="material-icons input-icon">schedule</span>
                    <input type="time" formControlName="scheduledTime"
                      (focus)="focused.set('time')" (blur)="focused.set('')" />
                  </div>
                </div>
              </div>

              <!-- Duration -->
              <div class="input-group">
                <label class="input-label">Duration <span class="required">*</span></label>
                <div class="duration-grid">
                  @for (d of durations; track d.value) {
                    <button type="button" class="duration-btn"
                      [class.active]="form.value.durationMinutes === d.value"
                      (click)="form.patchValue({ durationMinutes: d.value })">
                      <span class="d-label">{{ d.label }}</span>
                      <span class="d-sub">{{ d.sub }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Selected date/time summary -->
              @if (form.value.scheduledDate && form.value.scheduledTime) {
                <div class="summary-banner">
                  <span class="material-icons">event_available</span>
                  <span>
                    <strong>{{ formatDate(form.value.scheduledDate) }}</strong>
                    at <strong>{{ formatTime(form.value.scheduledTime) }}</strong>
                    · {{ form.value.durationMinutes }} min
                  </span>
                </div>
              }

              @if (sessionStore.error()) {
                <div class="error-banner">
                  <span class="material-icons">error_outline</span>
                  {{ sessionStore.error() }}
                </div>
              }

              <div class="form-actions">
                <button type="button" class="btn-cancel" (click)="back()">Cancel</button>
                <button type="submit" class="btn-submit"
                        [disabled]="form.invalid || sessionStore.loading()">
                  @if (sessionStore.loading()) {
                    <mat-spinner diameter="20" />
                    <span>Requesting...</span>
                  } @else {
                    <span class="material-icons">event</span>
                    <span>Request Session</span>
                  }
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; }

    .back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none; color: #6b7280;
      font-size: 14px; font-weight: 500; cursor: pointer;
      padding: 8px 0; margin-bottom: 24px; transition: color 0.15s;
    }
    .back-btn:hover { color: #4f46e5; }
    .back-btn .material-icons { font-size: 18px; }

    /* Layout */
    .layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }
    @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } }

    /* Mentor Card */
    .mentor-col { display: flex; flex-direction: column; gap: 16px; }
    .mentor-card {
      background: white; border-radius: 20px; border: 1px solid #e5e7eb;
      padding: 24px; display: flex; flex-direction: column;
      align-items: center; gap: 10px; text-align: center;
    }
    .mentor-avatar {
      width: 72px; height: 72px; border-radius: 20px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; font-size: 26px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .mentor-card h3 { font-size: 16px; font-weight: 700; color: #111827; margin: 0; }
    .mentor-exp { font-size: 13px; color: #6b7280; margin: 0; }
    .mentor-stats { display: flex; gap: 16px; }
    .stat { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: #374151; }
    .stat .material-icons { font-size: 15px; color: #9ca3af; }
    .avail-badge { display: flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .dot { width: 6px; height: 6px; border-radius: 50%; }
    .avail-available { background: #dcfce7; color: #16a34a; } .avail-available .dot { background: #16a34a; }
    .avail-busy { background: #fef3c7; color: #d97706; } .avail-busy .dot { background: #d97706; }

    /* Cost Card */
    .cost-card { background: #f9fafb; border-radius: 16px; border: 1px solid #e5e7eb; padding: 18px; }
    .cost-card h4 { font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 12px; }
    .cost-row { display: flex; justify-content: space-between; font-size: 13px; color: #6b7280; margin-bottom: 8px; }
    .cost-divider { height: 1px; background: #e5e7eb; margin: 8px 0; }
    .cost-row.total { font-size: 15px; font-weight: 700; color: #111827; }
    .cost-row.total span:last-child { color: #4f46e5; }

    /* Skeleton */
    .skeleton .skeleton-avatar { width: 72px; height: 72px; border-radius: 20px; background: #e5e7eb; }
    .skeleton-line { height: 14px; border-radius: 7px; background: #e5e7eb; margin: 6px 0; }
    .w60 { width: 60%; } .w40 { width: 40%; }

    /* Form Card */
    .form-card { background: white; border-radius: 20px; border: 1px solid #e5e7eb; padding: 28px; }
    .form-card h2 { font-size: 22px; font-weight: 800; color: #111827; margin: 0 0 4px; }
    .form-subtitle { font-size: 14px; color: #6b7280; margin: 0 0 24px; }
    .form { display: flex; flex-direction: column; gap: 18px; }

    /* Input Groups */
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-label { font-size: 13px; font-weight: 600; color: #374151; }
    .required { color: #ef4444; }

    .input-wrapper {
      display: flex; align-items: center;
      background: #f9fafb; border: 1.5px solid #e5e7eb;
      border-radius: 12px; padding: 0 14px; height: 52px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input-wrapper.focused {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
      background: white;
    }
    .input-wrapper.error { border-color: #ef4444; }
    .input-icon { font-size: 18px; color: #9ca3af; margin-right: 10px; flex-shrink: 0; }
    .input-wrapper.focused .input-icon { color: #4f46e5; }

    .input-wrapper input {
      flex: 1; border: none; outline: none;
      font-size: 15px; color: #111827;
      background: transparent; font-family: inherit;
      min-width: 0;
    }
    .input-wrapper input::placeholder { color: #9ca3af; }

    /* Native date/time inputs */
    .input-wrapper input[type="date"],
    .input-wrapper input[type="time"] {
      cursor: pointer;
      color-scheme: light;
    }
    .input-wrapper input[type="date"]::-webkit-calendar-picker-indicator,
    .input-wrapper input[type="time"]::-webkit-calendar-picker-indicator {
      cursor: pointer;
      opacity: 0.6;
      filter: invert(40%) sepia(100%) saturate(500%) hue-rotate(210deg);
    }

    .field-error { font-size: 12px; color: #ef4444; }

    /* Date + Time side by side */
    .date-time-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    @media (max-width: 480px) {
      .date-time-row { grid-template-columns: 1fr; }
    }

    /* Duration Grid */
    .duration-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    @media (max-width: 480px) {
      .duration-grid { grid-template-columns: repeat(2, 1fr); }
    }

    .duration-btn {
      height: 56px; border-radius: 12px;
      border: 1.5px solid #e5e7eb;
      background: white; color: #374151;
      font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.15s;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 2px;
    }
    .duration-btn:hover { border-color: #4f46e5; color: #4f46e5; background: #f5f3ff; }
    .duration-btn.active { background: #eef2ff; border-color: #4f46e5; color: #4f46e5; }
    .d-label { font-size: 14px; font-weight: 700; }
    .d-sub { font-size: 11px; opacity: 0.7; }

    /* Summary Banner */
    .summary-banner {
      display: flex; align-items: center; gap: 10px;
      background: #eef2ff; border: 1px solid #c7d2fe;
      border-radius: 12px; padding: 12px 16px;
      font-size: 14px; color: #4338ca;
    }
    .summary-banner .material-icons { font-size: 20px; color: #4f46e5; flex-shrink: 0; }

    /* Error Banner */
    .error-banner {
      display: flex; align-items: center; gap: 8px;
      background: #fef2f2; color: #dc2626;
      border: 1px solid #fecaca;
      padding: 12px 14px; border-radius: 10px; font-size: 14px;
    }
    .error-banner .material-icons { font-size: 18px; }

    /* Actions */
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
    @media (max-width: 480px) {
      .form-actions { flex-direction: column-reverse; }
      .btn-cancel, .btn-submit { width: 100%; justify-content: center; }
    }

    .btn-cancel {
      height: 48px; padding: 0 20px; border-radius: 12px;
      background: #f3f4f6; color: #374151; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s;
    }
    .btn-cancel:hover { background: #e5e7eb; }

    .btn-submit {
      height: 48px; padding: 0 24px; border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; border: none; font-size: 14px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      box-shadow: 0 4px 12px rgba(79,70,229,0.3); transition: opacity 0.2s;
    }
    .btn-submit:hover:not(:disabled) { opacity: 0.9; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-submit .material-icons { font-size: 18px; }
  `]
})
export class RequestSessionPage implements OnInit {
  readonly sessionStore = inject(SessionStore);
  readonly mentorStore = inject(MentorStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly focused = signal('');

  // Min date = today
  readonly today = new Date().toISOString().split('T')[0];

  readonly durations = [
    { label: '30 min', value: 30,  sub: '₹ × 0.5' },
    { label: '1 hr',   value: 60,  sub: '₹ × 1.0' },
    { label: '1.5 hr', value: 90,  sub: '₹ × 1.5' },
    { label: '2 hr',   value: 120, sub: '₹ × 2.0' },
  ];

  readonly form = this.fb.group({
    skillId:        [null as number | null, [Validators.required, Validators.min(1)]],
    scheduledDate:  ['', Validators.required],
    scheduledTime:  ['', Validators.required],
    durationMinutes:[60, Validators.required]
  });

  ngOnInit(): void {
    const mentorId = Number(this.route.snapshot.queryParamMap.get('mentorId'));
    if (mentorId) this.mentorStore.loadById(mentorId);
  }

  estimatedCost(hourlyRate: number): number {
    const mins = this.form.value.durationMinutes ?? 60;
    return (hourlyRate / 60) * mins;
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(t: string): string {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
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
        this.snack.open('Session requested successfully!', 'OK', { duration: 3000 });
        this.router.navigate(['/sessions']);
      }
    }, 800);
  }

  back(): void { this.router.navigate(['/mentors']); }
  initials(s: string): string { return s.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
}
