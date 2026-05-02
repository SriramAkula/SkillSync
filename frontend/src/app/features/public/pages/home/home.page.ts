import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStore } from '../../../../core/store/auth.store';

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

  /**
   * Returns gradient background class based on category index
   */
  getCategoryCardClass(index: number): string {
    const gradients = [
      'bg-gradient-to-br from-blue-600 to-blue-800',           // Frontend - Blue
      'bg-gradient-to-br from-emerald-600 to-emerald-800',     // Backend - Green
      'bg-gradient-to-br from-pink-600 to-pink-800',           // Design - Pink
      'bg-gradient-to-br from-orange-600 to-orange-800',       // Marketing - Orange
      'bg-gradient-to-br from-purple-600 to-purple-800',       // Mobile - Purple
      'bg-gradient-to-br from-indigo-600 to-indigo-800',       // AI/ML - Indigo
      'bg-gradient-to-br from-cyan-600 to-cyan-800',           // Business - Cyan
      'bg-gradient-to-br from-red-600 to-red-800',             // Writing - Red
    ];
    return gradients[index % gradients.length];
  }

  /**
   * Returns icon background color class based on category index
   */
  getCategoryIconBgClass(index: number): string {
    const iconBgs = [
      'bg-blue-500/20',              // Frontend
      'bg-emerald-500/20',           // Backend
      'bg-pink-500/20',              // Design
      'bg-orange-500/20',            // Marketing
      'bg-purple-500/20',            // Mobile
      'bg-indigo-500/20',            // AI/ML
      'bg-cyan-500/20',              // Business
      'bg-red-500/20',               // Writing
    ];
    return iconBgs[index % iconBgs.length];
  }
}
