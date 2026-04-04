import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MentorService, MentorProfile } from '../../../core/services/mentor.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { firstValueFrom } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mentor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mentor-list.component.html'
})
export class MentorListComponent implements OnInit {
  mentorService = inject(MentorService);
  userService = inject(UserService);
  toast = inject(ToastService);

  mentors: MentorProfile[] = [];
  loading = true;

  searchTerm = '';
  minExp: number | null = null;
  maxRate: number | null = null;

  ngOnInit() {
    this.loadMentors();
  }

  async loadMentors() {
    this.loading = true;
    try {
      const list = await firstValueFrom(this.mentorService.getApprovedMentors());
      await this.hydrateMentors(list);
      this.mentors = list;
    } catch (e) {
      this.toast.error('Failed to load mentors');
    } finally {
      this.loading = false;
    }
  }

  async search() {
    this.loading = true;
    try {
      const list = await firstValueFrom(
        this.mentorService.searchMentors(this.searchTerm || undefined, this.minExp || undefined, undefined, this.maxRate || undefined)
      );
      await this.hydrateMentors(list);
      this.mentors = list;
    } catch (e) {
      this.toast.error('Search failed');
    } finally {
      this.loading = false;
    }
  }

  // Bridge the gap because Backend returns userId but not the username
  private async hydrateMentors(list: MentorProfile[]) {
    // Collect unique userIds
    const userIds = [...new Set(list.map(m => m.userId).filter(id => !!id))];
    
    // Fetch user profiles concurrently
    const userProfiles = await Promise.all(
      userIds.map(id => 
        firstValueFrom(this.userService.getProfile(id)).catch(() => null)
      )
    );

    // Map by userId
    const userMap = new Map();
    userProfiles.forEach(up => {
      if (up) userMap.set(up.userId, up);
    });

    // Attach to mentors
    list.forEach(m => {
      if (m.userId && userMap.has(m.userId)) {
        m.username = userMap.get(m.userId).username;
        m.profileImageUrl = userMap.get(m.userId).profileImageUrl;
      } else {
        m.username = 'Unknown User';
      }
    });
  }
}
