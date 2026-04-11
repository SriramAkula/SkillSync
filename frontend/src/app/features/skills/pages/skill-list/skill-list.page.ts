import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SkillService } from '../../../../core/services/skill.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { UserService } from '../../../../core/services/user.service';
import { SkillDto, CreateSkillRequest } from '../../../../shared/models/skill.models';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-skill-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatSnackBarModule, PaginationComponent],
  templateUrl: './skill-list.page.html',
  styleUrl: './skill-list.page.scss'
})
export class SkillListPage implements OnInit {
  private readonly skillService = inject(SkillService);
  private readonly userService = inject(UserService);
  readonly authStore = inject(AuthStore);
  readonly skillStore = inject(SkillStore);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly allSkills = this.skillStore.skills;
  readonly loading = this.skillStore.loading;
  readonly saving = signal(false);
  readonly selectedSkill = signal<SkillDto | null>(null);
  readonly showForm = signal(false);
  readonly editingSkill = signal<SkillDto | null>(null);
  readonly selectedCategory = signal('');
  readonly showMySkills = signal(false);
  readonly categories = signal<string[]>([]);
  readonly selectedSkills = signal<string[]>([]);

  searchQuery = '';
  currentPage = signal(0);
  pageSize = signal(12);
  formData: CreateSkillRequest = { skillName: '', description: '', category: '' };

  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.skillStore.loadAll({ page: 0, size: this.pageSize() });
    this.searchSubject.pipe(debounceTime(350), distinctUntilChanged()).subscribe(q => {
      if (q.length >= 2) {
        this.skillStore.search({ keyword: q, page: 0, size: this.pageSize() });
      } else if (!q) {
        this.skillStore.loadAll({ page: 0, size: this.pageSize() });
      }
    });

    this.userService.getMyProfile().subscribe({
      next: (res) => {
        const profile = res.data;
        if (profile && profile.skills) {
          this.selectedSkills.set(profile.skills.split(',').map((s: string) => s.trim()));
        }
      }
    });
  }

  loadAll(): void { this.skillStore.loadAll({ page: 0, size: this.pageSize() }); }

  filteredSkills(): SkillDto[] {
    let list = this.skillStore.skills();
    if (this.showMySkills()) {
      list = list.filter(ss => !!ss.skillName && this.selectedSkills().includes(ss.skillName));
    } else if (this.selectedCategory()) {
      list = list.filter(s => s.category === this.selectedCategory());
    }
    
    if (this.searchQuery.trim().length >= 2) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(s => !!s.skillName && s.skillName.toLowerCase().includes(q) || (s.category && s.category.toLowerCase().includes(q)));
    }
    return list;
  }

  pagedSkills(): SkillDto[] {
    // Now return directly from store as it's server-side paged
    return this.filteredSkills();
  }

  onPageChange(page: number): void {
    const q = this.searchQuery.trim();
    if (q.length >= 2) {
      this.skillStore.search({ keyword: q, page, size: this.pageSize() });
    } else {
      this.skillStore.loadAll({ page, size: this.pageSize() });
    }
  }

  onSearch(q: string): void {
    this.searchSubject.next(q);
    this.currentPage.set(0); // Reset to first page on search
    // Also update categories from current store
    const cats = [...new Set(this.skillStore.skills().map(s => s.category).filter(Boolean) as string[])].sort();
    this.categories.set(cats);
  }

  filterByCategory(cat: string, mySkills = false): void {
    this.showMySkills.set(mySkills);
    this.selectedCategory.set(cat);
    this.currentPage.set(0); // Reset to first page on filter change
    // Categories act as local filter 
  }

  clearSearch(): void { this.searchQuery = ''; this.onPageChange(0); }
  clearAll(): void { this.searchQuery = ''; this.selectedCategory.set(''); this.showMySkills.set(false); this.onPageChange(0); }

  isSkillSelected(name: string): boolean {
    return this.selectedSkills().includes(name);
  }

  toggleProfileSkill(skill: SkillDto): void {
    const name = skill.skillName;
    if (!name) return;

    const list = this.selectedSkills();
    const isAdding = !list.includes(name);
    let updated: string[];
    let actionStr = '';
    
    if (!isAdding) {
      updated = list.filter(n => n !== name);
      actionStr = 'Removed from';
    } else {
      updated = [...list, name];
      actionStr = 'Added to';
    }
    
    // 1. Optimistic UI update for presence
    this.selectedSkills.set(updated);

    // 2. Optimistic UI update for popularity count
    const all = this.skillStore.skills();
    const found = all.find(s => s.id === skill.id);
    if (found) {
      const target = { ...found }; // Clone to ensure reference change for Angular
      target.popularityScore = isAdding ? (target.popularityScore || 0) + 1 : Math.max(0, (target.popularityScore || 0) - 1);
      this.skillStore.updateSkill(target);
    }
    
    // 3. Update User Profile (User Service)
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        const profile = res.data;
        this.userService.updateProfile({ 
          name: profile.name || profile.username,
          skills: updated.join(',') 
        }).subscribe({
          next: () => {
             this.snack.open(`${actionStr} your profile 🎉`, 'OK', { duration: 2500 });
             
             // 4. Update Popularity Count (Skill Service)
             this.skillService.updatePopularity(skill.id, isAdding).subscribe({
               next: (syncRes) => {
                 // Sync exactly with DB response
                 this.skillStore.updateSkill(syncRes.data);
               },
               error: () => {
                 // Silent fail for popularity sync, or log it
                 console.error('Failed to sync popularity to server');
               }
             });
          },
          error: (err) => {
            this.snack.open(err.error?.message ?? 'Failed to update skills', 'OK', { duration: 3000 });
            // Revert all optimistic changes on actual failure
            this.selectedSkills.set(list);
            this.skillStore.loadAll(undefined); // Full refresh to be safe
          }
        });
      }
    });
  }

  selectSkill(skill: SkillDto): void { this.selectedSkill.set(skill); }

  findMentors(skillName: string): void {
    this.selectedSkill.set(null);
    this.router.navigate(['/mentors'], { queryParams: { skill: skillName } });
  }

  findGroups(skillId: number): void {
    this.selectedSkill.set(null);
    this.router.navigate(['/groups'], { queryParams: { skillId } });
  }

  openCreate(): void {
    this.editingSkill.set(null);
    this.formData = { skillName: '', description: '', category: '' };
    this.showForm.set(true);
  }

  openEdit(skill: SkillDto): void {
    this.editingSkill.set(skill);
    this.formData = { skillName: skill.skillName, description: skill.description ?? '', category: skill.category ?? '' };
    this.showForm.set(true);
  }

  saveSkill(): void {
    if (!this.formData.skillName) return;
    this.saving.set(true);
    const obs = this.editingSkill()
      ? this.skillService.update(this.editingSkill()!.id, this.formData)
      : this.skillService.create(this.formData);

    obs.subscribe({
      next: (r) => {
        // Update shared store — apply-mentor page will reflect immediately
        if (this.editingSkill()) {
          this.skillStore.updateSkill(r.data);
          this.snack.open('Skill updated!', 'OK', { duration: 3000 });
        } else {
          this.skillStore.addSkill(r.data);
          this.snack.open('Skill created! It is now available in the mentor application form.', 'OK', { duration: 4000 });
        }
        // Refresh categories
        const cats = [...new Set(this.skillStore.skills().map(s => s.category).filter(Boolean) as string[])].sort();
        this.categories.set(cats);
        this.saving.set(false);
        this.showForm.set(false);
      },
      error: (e) => { this.saving.set(false); this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 }); }
    });
  }

  deleteSkill(id: number): void {
    this.skillService.delete(id).subscribe({
      next: () => { this.skillStore.removeSkill(id); this.snack.open('Skill deleted.', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e.error?.message ?? 'Failed', 'OK', { duration: 3000 })
    });
  }
}
