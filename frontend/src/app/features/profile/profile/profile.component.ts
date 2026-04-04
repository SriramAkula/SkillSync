import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, UserProfile } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  userService = inject(UserService);
  toast = inject(ToastService);

  profile: UserProfile | null = null;
  loading = true;
  saving = false;
  editing = false;

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.userService.getMyProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load profile');
        this.loading = false;
      }
    });
  }

  save() {
    if (!this.profile) return;
    this.saving = true;
    this.userService.updateProfile({
      username: this.profile.username,
      bio: this.profile.bio
    }).subscribe({
      next: (data) => {
        this.profile = data;
        this.toast.success('Profile updated successfully');
        this.editing = false;
        this.saving = false;
      },
      error: () => {
        this.toast.error('Failed to update profile');
        this.saving = false;
      }
    });
  }
}
