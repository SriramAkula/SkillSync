import { TestBed } from '@angular/core/testing';
import { LocalNotificationService } from './local-notification.service';

describe('LocalNotificationService', () => {
  let service: LocalNotificationService;
  const STORAGE_KEY = 'skillsync_notifications';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [LocalNotificationService]
    });
    service = TestBed.inject(LocalNotificationService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and load initial SEED data if storage is empty', () => {
    expect(service).toBeTruthy();
    expect(service.notifications().length).toBeGreaterThan(0);
    expect(service.notifications()[0].id).toBe('1');
  });

  it('should push a new notification and save to localStorage', () => {
    const message = 'New Test Notification';
    service.push(message, 'messages', '/test');

    const notifs = service.notifications();
    expect(notifs[0].message).toBe(message);
    expect(notifs[0].isRead).toBeFalse();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(saved[0].message).toBe(message);
  });

  it('should mark a notification as read', () => {
    const id = '1';
    service.markRead(id);
    
    const notif = service.notifications().find(n => n.id === id);
    expect(notif?.isRead).toBeTrue();
    expect(service.unreadCount()).toBe(service.notifications().filter(n => !n.isRead).length);
  });

  it('should mark all as read', () => {
    service.markAllRead();
    expect(service.unreadCount()).toBe(0);
    expect(service.notifications().every(n => n.isRead)).toBeTrue();
  });

  it('should filter by category', () => {
    const messages = service.filtered('messages');
    expect(messages.every(n => n.category === 'messages')).toBeTrue();

    const all = service.filtered('all');
    expect(all.length).toBe(service.notifications().length);
  });

  it('should remove a notification', () => {
    const initialCount = service.notifications().length;
    const idToRemove = '1';
    
    service.remove(idToRemove);
    expect(service.notifications().length).toBe(initialCount - 1);
    expect(service.notifications().find(n => n.id === idToRemove)).toBeUndefined();
  });

  it('should handle localStorage parse errors gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json');
    // Re-instantiate to trigger _load
    const newService = new LocalNotificationService();
    expect(newService.notifications().length).toBeGreaterThan(0); // Should fall back to SEED
  });
});
