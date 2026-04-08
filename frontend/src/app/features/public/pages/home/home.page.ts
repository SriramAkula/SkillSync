import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly categories = [
    { name: 'Frontend', icon: 'code' },
    { name: 'Backend', icon: 'storage' },
    { name: 'Design', icon: 'palette' },
    { name: 'Marketing', icon: 'insights' },
    { name: 'Mobile', icon: 'smartphone' },
    { name: 'AI / ML', icon: 'psychology' },
    { name: 'Business', icon: 'business_center' },
    { name: 'Writing', icon: 'edit_note' },
  ];

  constructor() {
    // Auto-redirect if already logged in
    if (this.authStore.isAuthenticated()) {
      this.router.navigate(['/mentors']);
    }
  }
}
