import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MentorService, MentorProfile } from '../../../core/services/mentor.service';
import { UserService, UserProfile } from '../../../core/services/user.service';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mentor-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mentor-detail.component.html'
})
export class MentorDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  mentorService = inject(MentorService);
  userService = inject(UserService);
  sessionService = inject(SessionService);
  authService = inject(AuthService);
  toast = inject(ToastService);

  mentor: MentorProfile | null = null;
  loading = true;
  booking = false;

  // Booking form
  showBookingModal = false;
  bookingDate = '';
  bookingTime = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMentor(+id);
    }
  }

  loadMentor(id: number) {
    this.mentorService.getMentorParams(id).subscribe({
      next: (data) => {
        this.mentor = data;
        // Hydrate username
        if (data.userId) {
          this.userService.getProfile(data.userId).subscribe({
            next: (up) => {
              this.mentor!.username = up.username;
              this.mentor!.profileImageUrl = up.profileImageUrl;
            }
          });
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load mentor details');
        this.loading = false;
      }
    });
  }

  openBooking() {
    if (!this.authService.isLoggedIn()) {
      this.toast.error('Please login as a learner to book a session');
      return;
    }
    if (!this.authService.hasRole('ROLE_LEARNER')) {
      this.toast.error('Only learners can book sessions');
      return;
    }
    this.showBookingModal = true;
  }

  confirmBooking() {
    if (!this.bookingDate || !this.bookingTime) {
      this.toast.error('Please select both date and time');
      return;
    }
    
    // Combine date and time to ISO string
    const d = new Date(`${this.bookingDate}T${this.bookingTime}`);
    const startTimeStr = d.toISOString().slice(0, 19); // simple naive ISO format often expected
    
    // Add 1 hour for end time
    d.setHours(d.getHours() + 1);
    const endTimeStr = d.toISOString().slice(0, 19);

    this.booking = true;
    this.sessionService.requestSession({
      mentorId: this.mentor!.mentorId,
      skillId: 1, // Mock skill ID for now, ideally user selects one or mentor has primary skillId
      startTime: startTimeStr,
      endTime: endTimeStr
    }).subscribe({
      next: () => {
        this.toast.success('Session requested successfully! Waiting for mentor acceptance.');
        this.showBookingModal = false;
        this.booking = false;
      },
      error: (e) => {
        this.toast.error(e.error?.message || 'Failed to request session');
        this.booking = false;
      }
    });
  }
}
