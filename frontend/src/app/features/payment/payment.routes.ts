import { Routes } from '@angular/router';
export const PAYMENT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/checkout/checkout.page').then(m => m.CheckoutPage) }
];
