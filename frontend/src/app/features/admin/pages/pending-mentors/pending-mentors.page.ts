import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { SkillService } from '../../../../core/services/skill.service';
import { SkillDto, CreateSkillRequest } from '../../../../shared/models/skill.models';
import { FormsModule } from '@angular/forms';

type AdminTab = 'mentors' | 'skills' | 'users';

@Component({
  selector: 'app-pending-mentors-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './pending-mentors.page.html',
  styleUrl: './pending-mentors.page.scss'
})
export class PendingMentorsPage implements OnInit {
  readonly mentorStore = inject(MentorStore);
  private readonly skillService = inject(SkillService);
  private readonly snack = inject(MatSnackBar);

  readonly tab = signal<AdminTab>('mentors');
  readonly skills = signal<SkillDto[]>([]);
  readonly skillsLoading = signal(false);
  readonly showSkillForm = signal(false);
  readonly editingSkill = signal<SkillDto | null>(null);
  readonly skillSaving = signal(false);

  skillSearch = '';
  skillForm: CreateSkillRequest = { skillName: '', description: '', category: '' };

  ngOnInit(): void { this.mentorStore.loadPending(undefined); }

  loadSkills(): void {
    if (this.skills().length) return;
    this.skillsLoading.set(true);
    this.skillService.getAll().subscribe({
      next: (r) => { this.skills.set(r.data ?? []); this.skillsLoading.set(false); },
      error: () => this.skillsLoading.set(false)
    });
  }

  filteredSkills(): SkillDto[] {
    const q = this.skillSearch.toLowerCase();
    return q ? this.skills().filter(s => s.skillName.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)) : this.skills();
  }

  approve(id: number): void { this.mentorStore.approve(id); this.snack.open('Mentor approved!', 'OK', { duration: 3000 }); }
  reject(id: number): void { this.mentorStore.reject(id); this.snack.open('Application rejected.', 'OK', { duration: 3000 }); }

  openCreate(): void {
    this.editingSkill.set(null);
    this.skillForm = { skillName: '', description: '', category: '' };
    this.showSkillForm.set(true);
  }

  openEdit(s: SkillDto): void {
    this.editingSkill.set(s);
    this.skillForm = { skillName: s.skillName, description: s.description ?? '', category: s.category ?? '' };
    this.showSkillForm.set(true);
  }

  saveSkill(): void {
    if (!this.skillForm.skillName) return;
    this.skillSaving.set(true);
    const obs = this.editingSkill()
      ? this.skillService.update(this.editingSkill()!.id, this.skillForm)
      : this.skillService.create(this.skillForm);
    obs.subscribe({
      next: (r) => {
        if (this.editingSkill()) {
          this.skills.update(list => list.map(s => s.id === r.data.id ? r.data : s));
          this.snack.open('Skill updated!', 'OK', { duration: 3000 });
        } else {
          this.skills.update(list => [r.data, ...list]);
          this.snack.open('Skill created!', 'OK', { duration: 3000 });
        }
        this.skillSaving.set(false);
        this.showSkillForm.set(false);
      },
      error: (e) => { this.skillSaving.set(false); this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 }); }
    });
  }

  deleteSkill(id: number): void {
    this.skillService.delete(id).subscribe({
      next: () => { this.skills.update(list => list.filter(s => s.id !== id)); this.snack.open('Skill deleted.', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 })
    });
  }
}
