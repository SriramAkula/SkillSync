import { Component, inject, OnInit, Output, EventEmitter, signal, HostListener, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { NotificationStore } from '../../core/auth/notification.store';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { NotificationDto } from '../../shared/models';

type NotifCategory = 'all' | 'messages' | 'sessions';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ThemeToggleComponent],
  template: `
    <nav class="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[100] px-6 lg:px-10 flex items-center justify-between shadow-sm transition-colors">
      
      <!-- Left: Mobile Menu Toggle + Desktop Search/Breadcrumb -->
      <div class="flex items-center gap-4 lg:gap-8 min-w-[200px]">
        <button 
          (click)="toggleSidebar.emit()"
          class="lg:flex p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hidden text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
          aria-label="Toggle Sidebar">
          <span class="material-icons-outlined transition-transform duration-300" [class.rotate-180]="isCollapsed">
            {{ isCollapsed ? 'menu' : 'menu_open' }}
          </span>
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
      <!-- Right Actions: Notifications & Profile -->
      <div class="flex items-center gap-3">
        
        <app-theme-toggle />
        
        @if (authStore.canApplyToBeMentor()) {
          <a routerLink="/mentors/apply" class="hidden sm:flex items-center bg-primary-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary-700 transition-all active:scale-95">
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
            <div class="fixed top-20 right-6 w-[420px] max-w-[calc(100vw-2rem)] backdrop-blur-xl bg-white/90 dark:bg-slate-900/95 border border-white/30 dark:border-slate-700/50 shadow-2xl animate-drop-in z-[1000] rounded-2xl overflow-hidden">
              <div class="p-4 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                <span class="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">Notifications</span>
                <button (click)="markAll()" class="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">Mark as read</button>
              </div>
              
              <div class="max-h-[440px] overflow-y-auto">
                @for (n of filteredNotifs(); track n.id) {
                  <div class="p-4 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer border-b border-slate-200 dark:border-slate-700/30 last:border-0" (click)="onNotifClick(n)">
                    <div class="flex gap-4">
                      <!-- Status Icon -->
                      <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm flex-shrink-0" [style.background]="getIconAttr(n.type).bg">
                        <span class="material-icons text-white text-lg">{{ getIconAttr(n.type).icon }}</span>
                      </div>
                      
                      <!-- Content -->
                      <div class="flex-1 min-w-0 overflow-hidden">
                        <p class="text-sm font-semibold leading-snug mb-1.5 line-clamp-2" 
                           [class.text-slate-900]="!n.isRead" 
                           [class.dark:text-white]="!n.isRead"
                           [class.text-slate-600]="n.isRead"
                           [class.dark:text-slate-400]="n.isRead">
                           {{ n.message }}
                        </p>
                        <div class="flex items-center gap-2">
                          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">{{ formatTime(n.createdAt) }}</span>
                          @if (!n.isRead) {
                            <span class="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0"></span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="p-12 text-center flex flex-col items-center gap-3">
                    <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600">
                      <span class="material-icons text-4xl">notifications_none</span>
                    </div>
                    <p class="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-wide">No new notifications</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- User Profile Dropdown -->
        <div class="relative profile-dropdown underline-none">
          <button (click)="dropdownOpen.set(!dropdownOpen())" class="h-10 w-10 overflow-hidden ring-2 ring-white/50 ring-offset-2 ring-offset-slate-100 rounded-xl hover:scale-105 transition-all shadow-md active:scale-95 bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-primary-200">
            <span class="text-white dark:text-white font-bold text-sm tracking-tighter">{{ initial() }}</span>
          </button>

          @if (dropdownOpen()) {
            <div class="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-800 shadow-2xl animate-drop-in z-[300] py-1 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div class="px-4 py-3 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 mb-1">
                <div class="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary-200 dark:shadow-primary-900/40">
                  {{ initial() }}
                </div>
                <div class="flex-1 truncate">
                  <p class="text-sm font-bold text-slate-900 dark:text-white truncate leading-none">{{ authStore.username() }}</p>
                  <span class="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-1 block">{{ displayRole() }}</span>
                </div>
              </div>

              <div class="px-2 space-y-0.5">
                <a routerLink="/profile" (click)="dropdownOpen.set(false)" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  <span class="material-icons-outlined text-base">account_circle</span>
                  Profile
                </a>
                <a routerLink="/sessions" (click)="dropdownOpen.set(false)" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  <span class="material-icons-outlined text-base">calendar_view_day</span>
                  My Sessions
                </a>
                <a routerLink="/profile/edit" (click)="dropdownOpen.set(false)" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  <span class="material-icons-outlined text-base">settings</span>
                  Settings
                </a>
              </div>

              <div class="border-t border-slate-200 dark:border-slate-700 mt-2 px-2 py-1">
                <button (click)="logout()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-colors">
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
  @Input() isCollapsed = false;
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
    const unreadNotifs = this.notifStore.unread();
    if (unreadNotifs.length === 0) {
      this.notifPanelOpen.set(false);
      return;
    }
    
    // Mark all notifications as read
    unreadNotifs.forEach(n => {
      this.notifStore.markRead(n.id);
    });
    
    // Close dropdown after a brief delay to let updates process
    setTimeout(() => {
      this.notifPanelOpen.set(false);
    }, 300);
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
