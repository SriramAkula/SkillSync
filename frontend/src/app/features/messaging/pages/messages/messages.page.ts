import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessagingService } from '../../../../core/services/messaging.service';
import { UserService } from '../../../../core/services/user.service';
import { GroupService } from '../../../../core/services/group.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ConversationEntry {
  id: number;
  name: string;
  type: 'user' | 'group';
  avatar?: string;
  subtitle?: string;
}

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss']
})
export class MessagesPage implements OnInit {
  private readonly messagingService = inject(MessagingService);
  private readonly userService = inject(UserService);
  private readonly groupService = inject(GroupService);

  readonly conversations = signal<ConversationEntry[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(): void {
    this.loading.set(true);
    
    forkJoin({
      users: this.messagingService.getActiveUsers().pipe(catchError(() => of([]))),
      groups: this.messagingService.getActiveGroups().pipe(catchError(() => of([])))
    }).subscribe({
      next: (ids: { users: number[], groups: number[] }) => {
        const userReqs = ids.users.map(id => 
          this.userService.getProfile(id).pipe(
            map(res => ({ id, name: res.data.name || res.data.username, type: 'user' as const, avatar: res.data.avatarUrl })),
            catchError(() => of({ id, name: `User ${id}`, type: 'user' as const }))
          )
        );

        const groupReqs = ids.groups.map(id => 
          this.groupService.getGroup(id).pipe(
            map(res => ({ id, name: res.data.name, type: 'group' as const, subtitle: 'Group Chat' })),
            catchError(() => of({ id, name: `Group ${id}`, type: 'group' as const, subtitle: 'Group Chat' }))
          )
        );

        if (userReqs.length === 0 && groupReqs.length === 0) {
          this.conversations.set([]);
          this.loading.set(false);
          return;
        }

        forkJoin([...userReqs, ...groupReqs]).subscribe({
          next: (entries) => {
            this.conversations.set(entries);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }

  openChat(entry: ConversationEntry): void {
    if (entry.type === 'user') {
      this.messagingService.openPrivateChat(entry.id, entry.name);
    } else {
      this.messagingService.openGroupChat(entry.id, entry.name);
    }
  }

  getInitials(name: string): string {
    return name.charAt(0).toUpperCase();
  }
}
