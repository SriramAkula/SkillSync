import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { AuthStore } from '../../../../core/auth/auth.store';
import { UserService } from '../../../../core/services/user.service';
import { UserProfileDto } from '../../../../shared/models';

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
  private readonly userService = inject(UserService);

  readonly checkingProfile = signal(true);
  readonly myProfile = this.mentorStore.myProfile;
  readonly baseProfile = signal<UserProfileDto | null>(null);
  readonly loadingProfile = signal(true); // Track base profile load
  readonly selectedSkills = signal<string[]>([]);
  readonly submissionError = signal<string | null>(null);
  
  // Robust aggregation: baseProfile takes precedence for new/updated external skills
  readonly userSkills = computed(() => {
    const m = this.myProfile();
    const b = this.baseProfile();
    
    // Priority: baseProfile (latest save) -> mentor.user (enriched) -> mentor.specialization (draft)
    const sources = [
      b?.skills,
      m?.user?.skills,
      m?.specialization
    ];

    const bestSource = sources.find(s => !!s && s.trim().length > 0) || '';
    return [...new Set(bestSource.split(',').map(s => s.trim()).filter(s => s.length > 0))];
  });
  
  skillSearch = '';
  form = { yearsOfExperience: null as number | null, hourlyRate: null as number | null, bio: '' };

  readonly benefits = [
    { icon: 'payments', title: 'Monetize Skillsets', desc: 'Turn your professional experience into a secondary income stream with hourly-based sessions.' },
    { icon: 'public', title: 'Global Impact', desc: 'Connect with students across time zones and help bridge the professional skill gap worldwide.' },
    { icon: 'workspace_premium', title: 'Verified Badge', desc: 'Successful mentors receive a verified checkmark increasing visibility and trust in the marketplace.' },
  ];

  statusClasses = computed(() => {
    const s = this.myProfile()?.status || 'PENDING';
    const map: Record<string, { bg: string; text: string }> = {
      'PENDING': { bg: 'bg-amber-500 shadow-amber-100', text: 'text-amber-600' },
      'APPROVED': { bg: 'bg-emerald-500 shadow-emerald-100', text: 'text-emerald-600' },
      'REJECTED': { bg: 'bg-red-500 shadow-red-100', text: 'text-red-600' }
    };
    return map[s] || map['PENDING'];
  });

  constructor() {
    // Reactively populate selectedSkills as soon as userSkills are computed
    effect(() => {
      const skills = this.userSkills();
      if (skills.length > 0 && this.selectedSkills().length === 0) {
        console.log('[ApplyMentor] Auto-syncing profile skills:', skills);
        this.selectedSkills.set(skills);
      }
    }, { allowSignalWrites: true });

    // Reactively handle the checkingProfile flag
    effect(() => {
      const isMentorLoading = this.mentorStore.loading();
      const isProfileLoading = this.loadingProfile();
      if (!isMentorLoading && !isProfileLoading) {
        this.checkingProfile.set(false);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Reset selection on load to ensure sync
    this.selectedSkills.set([]);

    // Always refresh mentor profile to get latest skills
    this.mentorStore.loadMyProfile(undefined);
    // Always reload skills to ensure latest data
    this.skillStore.loadForSelection(undefined);
    
    this.loadingProfile.set(true);
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        const profile = res.data;
        this.baseProfile.set(profile);
        console.log('[ApplyMentor] Deep Sync Profile Loaded:', profile);
        
        // DEEP SYNC: Prioritize Java if detected in profile
        const profileSkills = profile?.skills?.split(',').map(s => s.trim()) || [];
        if (profileSkills.includes('Java')) {
          console.log('[ApplyMentor] Java detected. Forcing selection.');
          this.selectedSkills.update(current => [...new Set(['Java', ...current])]);
        }
        
        this.loadingProfile.set(false);
      },
      error: () => {
        this.baseProfile.set(null);
        this.loadingProfile.set(false);
      }
    });
  }

  forceRefreshProfile(): void {
    console.log('[ApplyMentor] Manual force re-sync triggered...');
    this.checkingProfile.set(true);
    this.selectedSkills.set([]); // Clear to allow effect to re-populate
    this.mentorStore.loadMyProfile(undefined);
    this.loadingProfile.set(true);
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        const profile = res.data;
        this.baseProfile.set(profile);
        
        // DEEP SYNC: Prioritize Java if detected in profile
        const profileSkills = profile?.skills?.split(',').map(s => s.trim()) || [];
        if (profileSkills.includes('Java')) {
          this.selectedSkills.update(current => [...new Set(['Java', ...current])]);
        }
        
        this.loadingProfile.set(false);
      },
      error: () => {
        this.baseProfile.set(null);
        this.loadingProfile.set(false);
      }
    });
  }

  isFormValid(): boolean {
    const { yearsOfExperience, hourlyRate, bio } = this.form;
    return this.selectedSkills().length > 0 && 
           !!yearsOfExperience && 
           !!hourlyRate && 
           hourlyRate <= 500 && 
           bio.length >= 10;
  }

  filteredCategories(): { category: string; skills: { id: number; name: string }[] }[] {
    const q = this.skillSearch.toLowerCase().trim();
    const userSkillNames = this.userSkills(); // User's existing skills
    
    // Group all possible skills from store AND user's profile
    const map = new Map<string, { id: number; name: string }[]>();
    
    // 1. Add skills from Global Store
    const storeSkills = this.skillStore.skills();
    for (const s of storeSkills) {
      const cat = s.category?.trim() || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push({ id: s.id, name: s.skillName });
    }

    // 2. Ensure ALL profile skills are represented somewhere, add to "From Your Profile" if missing
    const allKnownSkillNames = new Set(storeSkills.map(s => s.skillName));
    const profileOnlySkills = userSkillNames.filter(name => !allKnownSkillNames.has(name));
    
    if (profileOnlySkills.length > 0) {
      const cat = 'Expertise from Your Profile';
      if (!map.has(cat)) map.set(cat, []);
      profileOnlySkills.forEach((name, i) => {
        map.get(cat)!.push({ id: 9999 + i, name });
      });
    }
    
    // Convert to array and sort
    let result = Array.from(map.entries())
      .sort((a, b) => a[0].includes('Profile') ? -1 : a[0].localeCompare(b[0]))
      .map(([category, skills]) => ({ 
        category, 
        skills: skills.sort((a, b) => a.name.localeCompare(b.name)) 
      }));
    
    // Filter to ONLY show skills the user HAS in their profile (as the selection list)
    const userSkillNamesSet = new Set(userSkillNames);
    result = result.map(cat => ({
      ...cat,
      skills: cat.skills.filter(s => userSkillNamesSet.has(s.name))
    })).filter(cat => cat.skills.length > 0);

    // Apply search filter
    if (q) {
      result = result.map(cat => ({ 
        ...cat, 
        skills: cat.skills.filter(s => s.name.toLowerCase().includes(q)) 
      })).filter(cat => cat.skills.length > 0);
    }
    
    return result;
  }

  toggleSkill(skill: string): void {
    this.selectedSkills.update(current => current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill]);
  }

  isSelected(skill: string): boolean {
    return this.selectedSkills().includes(skill);
  }

  submit(): void {
    if (!this.isFormValid()) return;
    this.submissionError.set(null);
    const { yearsOfExperience, hourlyRate, bio } = this.form;
    const specialization = this.selectedSkills().join(', ');
    
    this.mentorStore.applyAsMentor({ 
      specialization, 
      yearsOfExperience: yearsOfExperience || 0, 
      hourlyRate: hourlyRate || 0, 
      bio 
    });

    setTimeout(() => {
      const error = this.mentorStore.error();
      if (error) {
        this.submissionError.set(error);
      } else if (!error) {
        this.authStore.addRole('ROLE_MENTOR');
      }
    }, 1500);
  }

  statusIcon(status: string): string {
    const icons: Record<string, string> = { 
      PENDING: 'hourglass_empty', 
      REQUESTED: 'schedule',
      APPROVED: 'verified', 
      REJECTED: 'cancel' 
    };
    return icons[status] ?? 'info';
  }

  statusMessage(status: string): string {
    const msgs: Record<string, string> = {
      PENDING: "Your application is waiting for review. Our team will respond soon.",
      REQUESTED: "Your application has been submitted. Awaiting admin review.",
      APPROVED: 'Your mentor profile has been approved! You can now accept mentoring sessions.',
      REJECTED: 'Your application was declined. You can re-apply once you have more experience.'
    };
    return msgs[status] ?? 'Application status unknown';
  }
}
