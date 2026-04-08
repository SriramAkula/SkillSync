import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { UserProfileDto } from '../../../../shared/models';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-profile.page.html'
})
export class EditProfilePage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router      = inject(Router);
  private readonly fb          = inject(FormBuilder);
  readonly skillStore           = inject(SkillStore);
  private readonly authStore    = inject(AuthStore);

  readonly loading        = signal(true);
  readonly saving         = signal(false);
  readonly selectedSkills = signal<string[]>([]);

  readonly form = this.fb.group({
    firstName:   ['', [Validators.required]],
    lastName:    [''],
    username:    ['', [Validators.required]],
    email:       [{ value: '', disabled: true }],
    phoneNumber: ['', [Validators.required]],
    bio:         ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }

    this.userService.getMyProfile().subscribe({
      next:  res => { this.prefill(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  private prefill(p: UserProfileDto): void {
    const parts  = (p.name || '').trim().split(' ').filter(Boolean);
    const skills = p.skills ? p.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    this.form.patchValue({
      firstName:   parts[0] || '',
      lastName:    parts.slice(1).join(' ') || '',
      username:    p.username || this.authStore.username() || '',
      email:       p.email || this.authStore.email() || '',
      phoneNumber: p.phoneNumber || '',
      bio:         p.bio || ''
    });

    this.selectedSkills.set(skills);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  addSkill(event: Event): void {
    const sel   = event.target as HTMLSelectElement;
    const skill = sel.value;
    if (skill && !this.selectedSkills().includes(skill)) {
      this.selectedSkills.update(list => [...list, skill]);
    }
    sel.value = '';
  }

  removeSkill(skill: string): void {
    this.selectedSkills.update(list => list.filter(s => s !== skill));
  }

  save(): void {
    if (this.form.invalid) return;
    const val  = this.form.getRawValue();
    const name = `${val.firstName ?? ''} ${val.lastName ?? ''}`.trim();

    this.saving.set(true);
    this.userService.updateProfile({
      username:    val.username?.trim(),
      name,
      bio:         val.bio?.trim() || undefined,
      phoneNumber: val.phoneNumber?.trim() || undefined,
      skills:      this.selectedSkills().join(',') || undefined
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.userService.updateUser(res.data);
        this.authStore.updateUser(res.data.name, res.data.username);
        this.router.navigate(['/profile']);
      },
      error: () => this.saving.set(false)
    });
  }

  goBack(): void { this.router.navigate(['/profile']); }
}
