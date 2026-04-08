import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './unauthorized.component.html',
  styleUrl: './unauthorized.component.scss'
})
export class UnauthorizedComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authStore = inject(AuthStore);
  readonly isMentorStale = signal(false);

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    this.isMentorStale.set(reason === 'mentor');
  }

  relogin(): void {
    // Log out and redirect to login — user re-logs in and gets fresh JWT with ROLE_MENTOR
    this.authStore.logout();
  }
}
