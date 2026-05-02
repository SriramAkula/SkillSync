import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SessionStore } from '../../../../core/store/session.store';
import { MentorStore } from '../../../../core/store/mentor.store';
import { SkillStore } from '../../../../core/store/skill.store';

@Component({
  selector: 'app-request-session-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './request-session.page.html',
  styleUrl: './request-session.page.scss'
})
export class RequestSessionPage implements OnInit {
  readonly sessionStore = inject(SessionStore);
  readonly mentorStore = inject(MentorStore);
  readonly skillStore = inject(SkillStore);
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
    this.sessionStore.clearError();
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
  
  mentorName(): string {
    const m = this.mentorStore.selected();
    if (!m) return 'Loading...';
    // Prioritize full name from user profile, then mentor name, then username
    return m.user?.name || m.name || m.username || 'Mentor';
  }

  mentorInitials(): string {
    const m = this.mentorStore.selected();
    if (!m) return 'M';
    const nameStr = this.mentorName();
    if (nameStr === 'Mentor') return 'M';
    
    return nameStr
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
