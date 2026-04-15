import { Routes } from '@angular/router';
import { ChatPageComponent } from './pages';

export const MESSAGING_ROUTES: Routes = [
  {
    path: '',
    component: ChatPageComponent,
    data: { title: 'Messages' }
  },
  {
    path: 'direct/:userId',
    component: ChatPageComponent,
    data: { title: 'Direct Message' }
  },
  {
    path: 'group/:groupId',
    component: ChatPageComponent,
    data: { title: 'Group Chat' }
  }
];
