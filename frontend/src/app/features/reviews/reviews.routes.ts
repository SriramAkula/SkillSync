import { Routes } from '@angular/router';
export const REVIEW_ROUTES: Routes = [
  { path: 'mentor/:mentorId', loadComponent: () => import('./pages/mentor-reviews/mentor-reviews.page').then(m => m.MentorReviewsPage) }
];
