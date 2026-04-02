import { Injectable, signal, computed } from '@angular/core';

export type NotifCategory = 'all' | 'messages' | 'sessions';

export interface LocalNotification {
  id: string;
  message: string;
  category: 'messages' | 'sessions';
  timestamp: string;    // ISO string
  isRead: boolean;
  route?: string;       // optional navigation target
}

const STORAGE_KEY = 'skillsync_notifications';

const SEED: LocalNotification[] = [
  {
    id: '1',
    message: 'Your session with Mentor Alex has been confirmed!',
    category: 'sessions',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isRead: false,
    route: '/sessions'
  },
  {
    id: '2',
    message: 'New message from Priya: "Are you available tomorrow?"',
    category: 'messages',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isRead: false,
    route: '/sessions'
  },
  {
    id: '3',
    message: 'Your profile is 80% complete. Add skills to improve matches!',
    category: 'messages',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isRead: true,
    route: '/profile'
  },
  {
    id: '4',
    message: 'Session with Mentor Raj starts in 30 minutes.',
    category: 'sessions',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isRead: true,
    route: '/sessions'
  }
];

@Injectable({ providedIn: 'root' })
export class LocalNotificationService {
  // ── Internal state ─────────────────────────────────────────────────────────
  private readonly _notifications = signal<LocalNotification[]>([]);

  // ── Public computed ────────────────────────────────────────────────────────
  readonly notifications = this._notifications.asReadonly();

  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.isRead).length
  );

  constructor() {
    this._load();
  }

  // ── Filter by category ────────────────────────────────────────────────────
  filtered(category: NotifCategory): LocalNotification[] {
    if (category === 'all') return this._notifications();
    return this._notifications().filter(n => n.category === category);
  }

  // ── Mark single notification as read ──────────────────────────────────────
  markRead(id: string): void {
    this._notifications.update(list =>
      list.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    this._save();
  }

  // ── Mark all as read ──────────────────────────────────────────────────────
  markAllRead(): void {
    this._notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    this._save();
  }

  // ── Add a new notification (for toast integration) ────────────────────────
  push(message: string, category: 'messages' | 'sessions' = 'messages', route?: string): void {
    const notif: LocalNotification = {
      id: Date.now().toString(),
      message,
      category,
      timestamp: new Date().toISOString(),
      isRead: false,
      route
    };
    this._notifications.update(list => [notif, ...list]);
    this._save();
  }

  // ── Remove a notification ─────────────────────────────────────────────────
  remove(id: string): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
    this._save();
  }

  // ── Persistence ───────────────────────────────────────────────────────────
  private _load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: LocalNotification[] = raw ? JSON.parse(raw) : null;
      this._notifications.set(parsed?.length ? parsed : SEED);
    } catch {
      this._notifications.set(SEED);
    }
  }

  private _save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._notifications()));
  }
}
