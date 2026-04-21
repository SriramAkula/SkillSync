import { Routes } from '@angular/router';
import { MessagesPage } from './pages/messages/messages.page';
import { ChatPageComponent } from './pages';

export const MESSAGING_ROUTES: Routes = [
  {
    path: '',
    component: MessagesPage,
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
