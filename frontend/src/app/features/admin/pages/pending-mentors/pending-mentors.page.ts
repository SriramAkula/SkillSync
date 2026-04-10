import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { SkillService } from '../../../../core/services/skill.service';
import { SkillDto, CreateSkillRequest } from '../../../../shared/models/skill.models';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-pending-mentors-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatProgressSpinnerModule, MatSnackBarModule, PaginationComponent],
  templateUrl: './pending-mentors.page.html',
  styleUrl: './pending-mentors.page.scss'
})
export class PendingMentorsPage implements OnInit {
  readonly mentorStore = inject(MentorStore);
  private readonly snack = inject(MatSnackBar);

  currentPage = signal(0);
  pageSize = signal(10);

  ngOnInit(): void { 
    this.loadPending();
  }

  loadPending(page: number = 0): void {
    this.mentorStore.loadPending({ page, size: this.pageSize() });
  }

  pagedMentors() {
    return this.mentorStore.pending();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPending(page);
  }

  approve(id: number): void { 
    this.mentorStore.approve(id); 
    this.snack.open('Mentor approved!', 'OK', { duration: 3000 }); 
  }

  reject(id: number): void { 
    this.mentorStore.reject(id); 
    this.snack.open('Application rejected.', 'OK', { duration: 3000 }); 
  }
}
