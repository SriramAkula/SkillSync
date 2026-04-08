import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-apply-mentor-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './apply-mentor.page.html',
  styleUrl: './apply-mentor.page.scss'
})
export class ApplyMentorPage implements OnInit {
  readonly mentorStore = inject(MentorStore);
  readonly skillStore = inject(SkillStore);
  readonly authStore = inject(AuthStore);
  readonly router = inject(Router);

  readonly checkingProfile = signal(true);
  readonly myProfile = this.mentorStore.myProfile;
  readonly selectedSkills = signal<string[]>([]);
  
  skillSearch = '';
  form = { yearsOfExperience: null as number | null, hourlyRate: null as number | null, bio: '' };

  readonly benefits = [
    { icon: 'payments', title: 'Monetize Skillsets', desc: 'Turn your professional experience into a secondary income stream with hourly-based sessions.' },
    { icon: 'public', title: 'Global Impact', desc: 'Connect with students across time zones and help bridge the professional skill gap worldwide.' },
    { icon: 'workspace_premium', title: 'Verified Badge', desc: 'Successful mentors receive a verified checkmark increasing visibility and trust in the marketplace.' },
  ];

  statusClasses = computed(() => {
    const s = this.myProfile()?.status || 'PENDING';
    const map: Record<string, any> = {
      'PENDING': { bg: 'bg-amber-500 shadow-amber-100', text: 'text-amber-600' },
      'APPROVED': { bg: 'bg-emerald-500 shadow-emerald-100', text: 'text-emerald-600' },
      'REJECTED': { bg: 'bg-red-500 shadow-red-100', text: 'text-red-600' }
    };
    return map[s] || map['PENDING'];
  });

  ngOnInit(): void {
    this.mentorStore.loadMyProfile(undefined);
    if (this.skillStore.skills().length === 0) {
      this.skillStore.loadAll(undefined);
    }
    setTimeout(() => this.checkingProfile.set(false), 1200);
  }

  isFormValid(): boolean {
    const { yearsOfExperience, hourlyRate, bio } = this.form;
    return this.selectedSkills().length > 0 && 
           !!yearsOfExperience && 
           !!hourlyRate && 
           hourlyRate <= 500 && 
           bio.length >= 10;
  }

  filteredCategories() {
    const q = this.skillSearch.toLowerCase().trim();
    const source = this.skillStore.groupedByCategory();
    if (!q) return source;
    return source.map(cat => ({ ...cat, skills: cat.skills.filter(s => s.name.toLowerCase().includes(q)) })).filter(cat => cat.skills.length > 0);
  }

  toggleSkill(skill: string): void {
    this.selectedSkills.update(current => current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill]);
  }

  isSelected(skill: string): boolean {
    return this.selectedSkills().includes(skill);
  }

  submit(): void {
    if (!this.isFormValid()) return;
    const { yearsOfExperience, hourlyRate, bio } = this.form;
    const specialization = this.selectedSkills().join(', ');
    
    this.mentorStore.applyAsMentor({ 
      specialization, 
      yearsOfExperience: yearsOfExperience || 0, 
      hourlyRate: hourlyRate || 0, 
      bio 
    });

    setTimeout(() => {
      if (!this.mentorStore.error()) {
        this.authStore.addRole('ROLE_MENTOR');
      }
    }, 1000);
  }

  statusIcon(status: string): string {
    const icons: Record<string, string> = { PENDING: 'hourglass_empty', APPROVED: 'verified', REJECTED: 'cancel' };
    return icons[status] ?? 'info';
  }

  statusMessage(status: string): string {
    const msgs: Record<string, string> = {
      PENDING: "Hang tight! Our curators are reviewing your profile. We'll update you here soon.",
      APPROVED: 'Welcome to the inner circle! Your mentor capabilities are now fully unlocked.',
      REJECTED: 'Your application was declined. You can re-apply once you have more experience.'
    };
    return msgs[status] ?? '';
  }
}
