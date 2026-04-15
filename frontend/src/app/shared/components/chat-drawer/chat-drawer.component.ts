import { Component, Input, Output, EventEmitter, inject, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MessagingService } from '../../../core/services/messaging.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-chat-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-drawer.component.html',
  styleUrls: ['./chat-drawer.component.scss']
})
export class ChatDrawerComponent implements OnInit, AfterViewChecked, OnDestroy, OnChanges {
  private readonly messagingService = inject(MessagingService);
  private readonly userService = inject(UserService);

  @Input() title = 'Chat';
  @Input() isOpen = false;
  @Input() recipientId?: number;
  @Input() groupId?: number;

  @Output() closeDrawer = new EventEmitter<void>();

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages$ = this.messagingService.activeChat$;
  connected$ = this.messagingService.connected$;
  currentUserId?: number;
  newMessage = '';

  private groupSub: Subscription | null = null;
  private currentUserSub: Subscription | null = null;

  ngOnInit(): void {
    this.currentUserSub = this.userService.user$.subscribe(user => {
      this.currentUserId = user?.userId;
      if (this.currentUserId) {
        this.loadHistory();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const rId = changes['recipientId'];
    const gId = changes['groupId'];
    
    // Reload history if identifiers change and are not first change (handled by ngOnInit)
    if ((rId && !rId.firstChange) || (gId && !gId.firstChange)) {
      this.loadHistory();
    }
  }

  ngOnDestroy(): void {
    this.groupSub?.unsubscribe();
    this.currentUserSub?.unsubscribe();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  loadHistory(): void {
    this.groupSub?.unsubscribe();
    
    if (this.recipientId && this.currentUserId) {
      this.messagingService.getPrivateHistory(this.recipientId).subscribe();
    } else if (this.groupId) {
      this.messagingService.getGroupHistory(this.groupId).subscribe();

      // Subscribe to real-time group updates
      this.groupSub = this.messagingService.watchGroup(this.groupId).subscribe(msg => {
        // Skip our own messages to avoid duplicates (they are added optimistically)
        if (msg.senderId !== this.currentUserId) {
          this.messagingService.handleIncomingMessage(msg);
        }
      });
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    let sent = false;
    if (this.recipientId) {
      sent = this.messagingService.sendPrivate(this.recipientId, this.newMessage);
    } else if (this.groupId) {
      sent = this.messagingService.sendGroup(this.groupId, this.newMessage);
    }

    if (sent) {
      this.newMessage = '';
    }
  }

  onClose(): void {
    this.messagingService.clearActiveChat();
    this.closeDrawer.emit();
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.debug('Scroll error:', err);
    }
  }
}
