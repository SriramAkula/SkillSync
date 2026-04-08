import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MentorProfileDto } from '../../../../shared/models';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-mentor-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mentor-card.component.html',
  styleUrl: './mentor-card.component.scss'
})
export class MentorCardComponent {
  @Input({ required: true }) mentor!: MentorProfileDto;
  @Input() overrideRating?: number; // Pass loaded rating for current user
  @Input() overrideLearnersCount?: number; // Pass learners count for current user
  @Output() view = new EventEmitter<number>();
  @Output() book = new EventEmitter<number>();

  private readonly authStore = inject(AuthStore);

  // Use method instead of computed() — @Input is not available at computed() init time
  isOwnProfile(): boolean {
    const myId = this.authStore.userId();
    return myId !== null && Number(myId) === Number(this.mentor.userId);
  }

  initials(): string {
    const name = this.mentor.name || this.mentor.username || '';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
