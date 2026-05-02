import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationStore } from './notification.store';
import { NotificationService } from '../services/notification.service';
import { AuthStore } from './auth.store';
import { of } from 'rxjs';
import { ApiResponse, PageResponse, NotificationDto } from '../../shared/models';
import { patchState } from '@ngrx/signals';

describe('NotificationStore', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authStoreSpy: jasmine.SpyObj<any>;

  beforeEach(() => {
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'getAll', 'getUnread', 'getUnreadCount', 'markAsRead', 'delete'
    ]);
    authStoreSpy = jasmine.createSpyObj('AuthStore', ['refreshToken', 'isMentor']);

    TestBed.configureTestingModule({
      providers: [
        NotificationStore,
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: AuthStore, useValue: authStoreSpy }
      ]
    });

    store = TestBed.inject(NotificationStore);
  });

  it('should initialize with default state', () => {
    expect(store.notifications()).toEqual([]);
    expect(store.unreadCount()).toBe(0);
    expect(store.loading()).toBeFalse();
  });

  it('should load all notifications', () => {
    const mockRes = {
      data: {
        content: [{ id: 1, message: 'Test Notif', isRead: false }],
        totalElements: 1,
        totalPages: 1,
        currentPage: 0,
        pageSize: 15
      }
    };
    notificationServiceSpy.getAll.and.returnValue(of(mockRes as ApiResponse<PageResponse<NotificationDto>>));

    store.loadAll();

    expect(store.notifications().length).toBe(1);
    expect(store.totalElements()).toBe(1);
    expect(store.loading()).toBeFalse();
  });

  it('should refresh unread count', () => {
    notificationServiceSpy.getUnreadCount.and.returnValue(of({ data: 5 } as ApiResponse<number>));
    store.refreshUnreadCount();
    expect(store.unreadCount()).toBe(5);
  });

  it('should mark a notification as read and decrement count', () => {
    const notif = { id: 10, isRead: false };
    patchState(store, { notifications: [notif as unknown as NotificationDto], unreadCount: 1 });
    
    notificationServiceSpy.markAsRead.and.returnValue(of({ success: true } as ApiResponse<void>));
    notificationServiceSpy.getUnreadCount.and.returnValue(of({ data: 0 } as ApiResponse<number>));

    store.markRead(10);

    expect(store.notifications()[0].isRead).toBeTrue();
    expect(store.unreadCount()).toBe(0);
  });

  it('should delete a notification and refresh', () => {
    const notif = { id: 20, isRead: true };
    patchState(store, { notifications: [notif as unknown as NotificationDto] });
    
    notificationServiceSpy.delete.and.returnValue(of({ success: true } as ApiResponse<void>));
    notificationServiceSpy.getAll.and.returnValue(of({ data: { content: [] } } as unknown as ApiResponse<PageResponse<NotificationDto>>));

    store.deleteNotification(20);

    expect(store.notifications().length).toBe(0);
    expect(notificationServiceSpy.delete).toHaveBeenCalledWith(20);
  });

  it('should handle polling and trigger refresh on new content', fakeAsync(() => {
    patchState(store, { unreadCount: 0 });
    notificationServiceSpy.getUnread.and.returnValue(of({ data: { content: [{ id: 1, type: 'MSG' }] } } as unknown as ApiResponse<PageResponse<NotificationDto>>));
    notificationServiceSpy.getAll.and.returnValue(of({ data: { content: [{ id: 1 }] } } as unknown as ApiResponse<PageResponse<NotificationDto>>));

    store.startPolling();
    tick(30000); // environment.pollIntervalMs is 30s in development usually

    expect(notificationServiceSpy.getUnread).toHaveBeenCalled();
    expect(store.unreadCount()).toBe(1);
    
    store.stopPolling();
  }));

  it('should refresh token if mentor approval notification detected during poll', fakeAsync(() => {
    patchState(store, { unreadCount: 0 });
    authStoreSpy.isMentor.and.returnValue(false);
    
    notificationServiceSpy.getUnread.and.returnValue(of({ 
        data: { content: [{ id: 2, type: 'MENTOR_APPROVED' }] } 
    } as unknown as ApiResponse<PageResponse<NotificationDto>>));
    notificationServiceSpy.getAll.and.returnValue(of({ data: { content: [] } } as unknown as ApiResponse<PageResponse<NotificationDto>>));

    store.startPolling();
    tick(30000);

    expect(authStoreSpy.refreshToken).toHaveBeenCalled();
    store.stopPolling();
  }));
});
