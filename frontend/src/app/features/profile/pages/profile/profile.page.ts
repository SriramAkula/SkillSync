import { Component, inject, OnInit, OnDestroy, signal, effect, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { UserProfileDto, NotificationDto } from '../../../../shared/models';
import { ToastService } from '../../../../core/services/toast.service';
import { ProfileCompletionService } from '../../../../core/services/profile-completion.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ThemeService } from '../../../../core/services/theme.service';

interface UserActivity {
  id: string;
  icon: string;
  colorClass: string;
  text: string;
  status: string;
  statusClass: string;
  timestamp: number;
}

interface ConfettiDrop {
  x: number;
  delay: number;
  color: string;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  readonly completionService = inject(ProfileCompletionService);
  readonly authStore = inject(AuthStore);
  readonly skillStore = inject(SkillStore);
  readonly themeService = inject(ThemeService);

  private routerSub: Subscription | null = null;

  readonly profile = signal<UserProfileDto | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly isEditing = signal(false);
  readonly showBadge = signal(false);
  readonly avatarUrl = signal<string | null>(null);
  readonly isSkillDropdownOpen = signal(false);
  readonly isPrivate = signal(false);
  readonly showConfetti = signal(false);
  readonly isDragOver = signal(false);
  readonly activities = signal<UserActivity[]>([]);

  confettiDrops: ConfettiDrop[] = [];

  readonly allSkillOptions = computed(() => {
    const backend = this.skillStore.skillNames();
    const SOFT_SKILLS = ['Problem Solving', 'Communication', 'Teamwork', 'Leadership', 'Time Management', 'Creativity'];
    return [...new Set([...backend, ...SOFT_SKILLS])].sort();
  });

  readonly form = this.fb.group({
    username:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    firstName:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastName:    ['', [Validators.minLength(2), Validators.maxLength(100)]],
    bio:         ['', [Validators.maxLength(500)]],
    phoneNumber: ['', [Validators.pattern('^[0-9]{10}$')]],
    skills:      [[] as string[]]
  });

  constructor() {
    effect(() => {
      if (this.completionPercentage() === 100 && !this.showBadge() && this.profile()) { 
        this.showBadge.set(true); localStorage.setItem('profileBadge', 'true'); this.triggerConfetti();
      }
    }, { allowSignalWrites: true });
  }

  readonly completionPercentage = computed(() => this.completionService.calculateCompletion(this.profile()));
  readonly profileLevel = computed(() => this.completionPercentage() < 40 ? 'Beginner 🥉' : (this.completionPercentage() < 80 ? 'Intermediate 🥈' : 'Pro 🥇'));
  readonly displayRole = computed(() => this.authStore.isAdmin() ? 'Admin' : (this.authStore.isMentor() ? 'Mentor' : 'Learner'));
  readonly displayEmail = computed(() => this.authStore.email() || this.profile()?.email || '');
  readonly displayUsername = computed(() => this.profile()?.username || this.authStore.email()?.split('@')[0] || 'User');
  selectedSkills(): string[] { return (this.form.get('skills')?.value || []) as string[]; }

  ngOnInit(): void {
    if (localStorage.getItem('profileBadge') === 'true') this.showBadge.set(true);
    this.refreshProfile(); 
    this.loadActivities(); 
    this.skillStore.loadAll(undefined);

    // Auto-refresh profile when navigating to this page
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects || event.url;
        // Refresh profile when on /profile page
        if (url === '/profile' || url.startsWith('/profile?')) {
          console.log('🔄 Profile page detected, refreshing...', url);
          this.refreshProfile();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  loadActivities() {
    this.notificationService.getAll().subscribe({
      next: (res) => {
        const backend = (res.data?.content || []).map((n: NotificationDto) => this.mapNotificationToActivity(n));
        const combined = backend.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
        this.activities.set(combined);
      }
    });
  }

  private mapNotificationToActivity(n: NotificationDto): UserActivity {
    let icon = 'notifications'; let colorClass = 'bg-blue-500';
    if (n.type.includes('SESSION')) { icon = 'check_circle'; colorClass = 'bg-indigo-500'; }
    if (n.type.includes('PAYMENT')) { icon = 'payments'; colorClass = 'bg-emerald-500'; }
    const timestamp = n.createdAt ? new Date(n.createdAt).getTime() : Date.now();
    return { id: n.id.toString(), icon, colorClass, text: n.message, status: 'Update', statusClass: 'text-blue-700', timestamp };
  }

  getActivityIconClass(act: UserActivity): string {
    const color = act.colorClass.replace('bg-', '').replace('-500', '');
    return this.themeService.isDark() ? `bg-${color}-500/20` : `bg-${color}-50`;
  }
  getActivityTextClass(act: UserActivity): string {
    const color = act.colorClass.replace('bg-', '').replace('-500', '');
    return this.themeService.isDark() ? `text-${color}-400` : `text-${color}-600`;
  }
  getActivityStatusClass(act: UserActivity): string {
    if (act.colorClass.includes('indigo')) return this.themeService.isDark() ? 'text-indigo-400' : 'text-indigo-700';
    if (act.colorClass.includes('emerald')) return this.themeService.isDark() ? 'text-emerald-400' : 'text-emerald-700';
    return this.themeService.isDark() ? 'text-slate-400' : 'text-slate-600';
  }

  formatTime(ts: number): string {
    if (!ts || isNaN(ts)) return 'Just now';
    const diff = Math.floor((Date.now() - ts) / 60000);
    return diff < 1 ? 'Just now' : (diff < 60 ? `${diff}m ago` : (diff < 1440 ? `${Math.floor(diff/60)}h ago` : `${Math.floor(diff/1440)}d ago`));
  }

  triggerConfetti() {
    this.confettiDrops = Array.from({ length: 30 }).map(() => ({ x: Math.random() * 100, delay: Math.random() * 2, color: '#6366f1' }));
    this.showConfetti.set(true); setTimeout(() => this.showConfetti.set(false), 4000);
  }

  toggleVisibility() { this.isPrivate.set(!this.isPrivate()); this.toast.success('Visibility Updated'); }
  copyToClipboard(text: string) { navigator.clipboard.writeText(text).then(() => this.toast.success("Copied!")); }
  
  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && (c?.dirty || c?.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || (!control.dirty && !control.touched)) return '';

    const errors = control.errors;
    if (errors['required']) return `${this.formatFieldName(field)} is required`;
    if (errors['minlength']) return `${this.formatFieldName(field)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.formatFieldName(field)} can be maximum ${errors['maxlength'].requiredLength} characters`;
    if (errors['pattern']) return this.getPatternErrorMessage(field);
    return 'Invalid input';
  }

  private getPatternErrorMessage(field: string): string {
    if (field === 'phoneNumber') return 'Phone number must be exactly 10 digits and contain only numbers';
    return 'Invalid format';
  }

  private formatFieldName(field: string): string {
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }
  
  toggleEdit(): void { if (!this.profile()) return; this.isEditing.update(v => !v); if (!this.isEditing()) this.patchFormValues(this.profile()!); }
  cancelEdit() { this.isEditing.set(false); if (this.profile()) this.patchFormValues(this.profile()!); }

  patchFormValues(p: UserProfileDto) {
    let fName = p.firstName || '';
    let lName = p.lastName || '';
    
    // Fallback for OAuth profiles that only have a 'name' field
    if (!fName && p.name) {
      const parts = p.name.trim().split(' ');
      fName = parts[0];
      lName = parts.slice(1).join(' ');
    }

    this.form.patchValue({
      username: p.username || '', 
      firstName: fName, 
      lastName: lName,
      bio: p.bio || '', 
      phoneNumber: p.phoneNumber || '',
      skills: (p.skills ? p.skills.split(',').map(s => s.trim()) : [])
    });

    if (p.avatarUrl) {
      this.avatarUrl.set(p.avatarUrl);
    } else {
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) this.avatarUrl.set(savedAvatar);
    }
  }

  refreshProfile(): void {
    this.loading.set(true);
    this.userService.getMyProfile().subscribe({
      next: (res) => { this.profile.set(res.data); this.patchFormValues(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const val = this.form.getRawValue();
    this.userService.updateProfile({
      username: val.username || undefined, name: `${val.firstName} ${val.lastName}`.trim(),
      bio: val.bio || undefined, phoneNumber: val.phoneNumber || undefined,
      skills: (Array.isArray(val.skills) ? val.skills.join(',') : '') || undefined
    }).subscribe({
      next: (res) => { this.profile.set(res.data); this.patchFormValues(res.data); this.saving.set(false); this.isEditing.set(false); this.toast.success("Saved ✅"); },
      error: () => { this.saving.set(false); this.toast.error("Error"); }
    });
  }

  logout(): void { this.authStore.logout(); }
  initials(): string { return (this.profile()?.name || '?').charAt(0).toUpperCase(); }
  fullName(): string { return this.profile()?.name || this.profile()?.username || 'Guest'; }
  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragOver.set(true); }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.isDragOver.set(false); }
  onDrop(e: DragEvent) { e.preventDefault(); this.isDragOver.set(false); if (e.dataTransfer?.files[0]) this.handleFile(e.dataTransfer.files[0]); }
  onFileSelected(e: Event): void { const files = (e.target as HTMLInputElement).files; if (files?.[0]) this.handleFile(files[0]); }
  private handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    
    // Optimistic UI update
    const reader = new FileReader();
    reader.onload = () => { const base = reader.result as string; this.avatarUrl.set(base); localStorage.setItem('userAvatar', base); };
    reader.readAsDataURL(file);

    // Actual upload
    this.userService.uploadProfileImage(file).subscribe({
      next: (res) => {
        this.toast.success('Profile picture updated!');
        if (res.data?.avatarUrl) {
          this.avatarUrl.set(res.data.avatarUrl);
        }
      },
      error: () => this.toast.error('Failed to upload profile picture')
    });
  }
  toggleSkillDropdown(): void { this.isSkillDropdownOpen.update(v => !v); }
  toggleSkill(skill: string, e: Event): void {
    e.stopPropagation(); const curr = this.selectedSkills();
    this.form.patchValue({ skills: (curr.includes(skill) ? curr.filter(s => s !== skill) : [...curr, skill]) });
  }
  removeSkill(skill: string) { this.form.patchValue({ skills: this.selectedSkills().filter(s => s !== skill) }); }
  @HostListener('document:keydown', ['$event']) onKeydown(e: KeyboardEvent) { if (this.isEditing() && e.key === 'Escape') this.cancelEdit(); }
  @HostListener('document:click', ['$event']) onDocumentClick(e: MouseEvent) { if (!(e.target as HTMLElement).closest('.custom-dropdown')) this.isSkillDropdownOpen.set(false); }
}
