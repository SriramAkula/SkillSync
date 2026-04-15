import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { ToastService } from '../../../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-pending-mentors-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatProgressSpinnerModule, PaginationComponent],
  templateUrl: './pending-mentors.page.html',
  styleUrl: './pending-mentors.page.scss'
})
export class PendingMentorsPage implements OnInit {
  readonly mentorStore = inject(MentorStore);
  private readonly toast = inject(ToastService);

  currentPage = signal(0);
  pageSize = signal(10);

  ngOnInit(): void { 
    this.loadPending();
  }

  loadPending(page = 0): void {
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
    this.toast.success('Mentor approved!');
  }

  reject(id: number): void { 
    this.mentorStore.reject(id); 
    this.toast.success('Application rejected.'); 
  }
}
