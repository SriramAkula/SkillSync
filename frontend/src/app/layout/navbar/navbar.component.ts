import { Component, inject, OnInit, Output, EventEmitter, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { NotificationStore } from '../../core/auth/notification.store';
import { NotificationDto } from '../../shared/models';

type NotifCategory = 'all' | 'messages' | 'sessions';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="h-16 glass-effect border-b border-white/20 sticky top-0 z-[100] px-6 lg:px-10 flex items-center justify-between shadow-sm">
      
      <!-- Left: Mobile Menu Toggle + Desktop Search/Breadcrumb -->
      <div class="flex items-center gap-4 lg:gap-8">
        <button 
          (click)="toggleSidebar.emit()"
          class="lg:flex p-2 rounded-xl hover:bg-slate-100 transition-colors hidden text-slate-500 hover:text-primary-600 focus:outline-none"
          aria-label="Toggle Sidebar">
          <span class="material-icons-outlined">menu_open</span>
        </button>
        
        <button 
          (click)="toggleSidebar.emit()"
          class="lg:hidden p-2 rounded-xl text-slate-500 active:bg-slate-100 transition-colors"
          aria-label="Mobile Sidebar Toggle">
          <span class="material-icons-outlined">menu</span>
        </button>

        <!-- Brand (Mobile Only) -->
        <span class="lg:hidden text-xl font-bold tracking-tight text-primary-600">SkillSync</span>
      </div>

      <!-- Center: Desktop Search Bar (Premium Feel) -->
      <div class="hidden md:flex flex-1 max-w-md mx-8">
        <div class="relative w-full group">
          <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">search</span>
          <input 
            type="text" 
            placeholder="Search mentors or skills..."
            class="w-full bg-slate-100/50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none text-slate-600"
          />
        </div>
      </div>

      <!-- Right Actions: Notifications & Profile -->
      <div class="flex items-center gap-3">
        
        @if (authStore.canApplyToBeMentor()) {
          <a routerLink="/mentors/apply" class="hidden sm:flex items-center bg-primary-600 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all active:scale-95">
            <span class="material-icons-outlined text-base mr-2">verified_user</span>
            Become Mentor
          </a>
        }

        <!-- Notifications -->
        <div class="relative">
          <button (click)="toggleNotifPanel()" class="notif-btn p-2 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-white/80 transition-all group relative">
            <span class="material-icons-outlined">notifications</span>
            @if (notifStore.unreadCount() > 0) {
              <span class="absolute top-1 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
            }
          </button>

          <!-- Notification Dropdown (Glassmorphism) -->
          @if (notifPanelOpen()) {
            <div class="absolute top-full right-0 mt-3 w-[360px] glass-card shadow-2xl animate-drop-in z-[200]">
              <div class="p-4 border-b border-white/20 flex justify-between items-center">
                <span class="text-xs font-bold uppercase tracking-widest text-slate-400">Notifications</span>
                <button (click)="markAll()" class="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">Mark as read</button>
              </div>
              
              <div class="max-h-[400px] overflow-y-auto">
                @for (n of filteredNotifs(); track n.id) {
                  <div class="p-3 hover:bg-white/40 transition-colors cursor-pointer border-b border-white/10 last:border-0" (click)="onNotifClick(n)">
                    <div class="flex gap-3">
                      <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" [style.background]="getIconAttr(n.type).bg">
                        <span class="material-icons text-white text-base">{{ getIconAttr(n.type).icon }}</span>
                      </div>
                      <div class="flex-1">
                        <p class="text-sm font-medium leading-relaxed" [class.text-slate-800]="!n.isRead" [class.text-slate-500]="n.isRead">{{ n.message }}</p>
                        <span class="text-[10px] uppercase font-bold text-slate-400 mt-1 block tracking-wider">{{ formatTime(n.createdAt) }}</span>
                      </div>
                      @if (!n.isRead) {
                        <div class="w-2 h-2 bg-primary-500 rounded-full mt-1 shrink-0 shadow-sm shadow-primary-200"></div>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="p-10 text-center flex flex-col items-center gap-2">
                    <span class="material-icons-outlined text-4xl text-slate-200">check_circle_outline</span>
                    <p class="text-sm font-medium text-slate-500 tracking-wide">All caught up!</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- User Profile Dropdown -->
        <div class="relative profile-dropdown underline-none">
          <button (click)="dropdownOpen.set(!dropdownOpen())" class="h-10 w-10 overflow-hidden ring-2 ring-white/50 ring-offset-2 ring-offset-slate-100 rounded-xl hover:scale-105 transition-all shadow-md active:scale-95 bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-primary-200">
            <span class="text-white font-bold text-sm tracking-tighter">{{ initial() }}</span>
          </button>

          @if (dropdownOpen()) {
            <div class="absolute top-full right-0 mt-3 w-64 glass-card shadow-2xl animate-drop-in z-[300] py-1 border border-white/20">
              <div class="px-4 py-3 flex items-center gap-3 border-b border-white/10 mb-1">
                <div class="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary-100">
                  {{ initial() }}
                </div>
                <div class="flex-1 truncate">
                  <p class="text-sm font-bold text-slate-800 truncate leading-none">{{ authStore.username() }}</p>
                  <span class="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1 block">{{ displayRole() }}</span>
                </div>
              </div>

              <div class="px-2 space-y-0.5">
                <a routerLink="/profile" (click)="dropdownOpen.set(false)" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-white/50 hover:text-primary-600 transition-colors">
                  <span class="material-icons-outlined text-base">account_circle</span>
                  Profile
                </a>
                <a routerLink="/sessions" (click)="dropdownOpen.set(false)" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-white/50 hover:text-primary-600 transition-colors">
                  <span class="material-icons-outlined text-base">calendar_view_day</span>
                  My Sessions
                </a>
                <a routerLink="/profile/edit" (click)="dropdownOpen.set(false)" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-white/50 hover:text-primary-600 transition-colors">
                  <span class="material-icons-outlined text-base">settings</span>
                  Settings
                </a>
              </div>

              <div class="border-t border-white/10 mt-2 px-2 py-1">
                <button (click)="logout()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50/50 hover:text-red-600 transition-colors">
                  <span class="material-icons-outlined text-base">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    @keyframes drop-in {
      from { opacity: 0; transform: translateY(-10px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-drop-in {
      animation: drop-in 0.2s cubic-bezier(0, 0, 0.2, 1);
    }
    :host ::ng-deep .active {
      color: #7c3aed !important;
    }
  `]
})
export class NavbarComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  readonly authStore = inject(AuthStore);
  readonly notifStore = inject(NotificationStore);
  private readonly router = inject(Router);

  readonly dropdownOpen = signal(false);
  readonly notifPanelOpen = signal(false);
  readonly activeTab = signal<NotifCategory>('all');

  readonly displayRole = computed(() => {
    if (this.authStore.isAdmin()) return 'Administrator';
    if (this.authStore.isMentor()) return 'Mentor';
    return 'Learner';
  });

  filteredNotifs = computed(() => {
    const list = this.notifStore.notifications();
    return list.slice(0, 5);
  });

  ngOnInit(): void {
    this.notifStore.loadAll();
    this.notifStore.startPolling();
  }

  initial(): string {
    const u = this.authStore.username();
    return u ? u[0].toUpperCase() : '?';
  }

  getIconAttr(type: string): { icon: string, bg: string } {
    const up = type.toUpperCase();
    if (up.includes('SESSION') || up.includes('MENTOR')) return { icon: 'event', bg: '#8b5cf6' };
    if (up.includes('MESSAGE') || up.includes('REVIEW')) return { icon: 'chat_bubble', bg: '#ec4899' };
    return { icon: 'notifications', bg: '#f59e0b' };
  }

  toggleNotifPanel(): void {
    this.notifPanelOpen.update(v => !v);
    this.dropdownOpen.set(false);
  }

  markAll(): void {
    this.notifStore.unread().forEach(n => this.notifStore.markRead(n.id));
  }

  onNotifClick(n: NotificationDto): void {
    if (!n.isRead) {
      this.notifStore.markRead(n.id);
    }
    this.notifPanelOpen.set(false);

    if (n.type.includes('SESSION')) {
      this.router.navigate(['/sessions']);
    } else if (n.type.includes('PROFILE')) {
      this.router.navigate(['/profile']);
    }
  }

  formatTime(iso: string | null | undefined): string {
    if (!iso) return 'now';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  logout(): void {
    this.dropdownOpen.set(false);
    this.notifStore.stopPolling();
    this.authStore.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.profile-dropdown')) this.dropdownOpen.set(false);
    if (!target.closest('.notif-btn') && !target.closest('.glass-card')) this.notifPanelOpen.set(false);
  }
}
