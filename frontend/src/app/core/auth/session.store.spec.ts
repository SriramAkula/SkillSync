import { TestBed } from '@angular/core/testing';
import { SessionStore } from './session.store';
import { SessionService } from '../services/session.service';
import { of, throwError } from 'rxjs';
import { SessionDto, ApiResponse, PageResponse } from '../../shared/models';
import { patchState } from '@ngrx/signals';

describe('SessionStore', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;
  let sessionServiceSpy: jasmine.SpyObj<SessionService>;

  const mockSession: SessionDto = {
    id: 1,
    mentorId: 1,
    learnerId: 2,
    skillId: 1,
    skillName: 'Angular',
    scheduledAt: new Date().toISOString(),
    durationMinutes: 60,
    status: 'REQUESTED',
    mentorName: 'John Mentor',
    learnerName: 'Jane Learner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockPageResponse: PageResponse<SessionDto> = {
    content: [mockSession],
    totalElements: 1,
    totalPages: 1,
    currentPage: 0,
    pageSize: 10
  };

  beforeEach(() => {
    sessionServiceSpy = jasmine.createSpyObj('SessionService', [
      'getLearnerSessions',
      'getMentorSessions',
      'getSession',
      'requestSession',
      'acceptSession',
      'rejectSession',
      'cancelSession'
    ]);

    TestBed.configureTestingModule({
      providers: [
        SessionStore,
        { provide: SessionService, useValue: sessionServiceSpy }
      ]
    });

    store = TestBed.inject(SessionStore);
  });

  it('should initialize with default state', () => {
    expect(store.learnerSessions()).toEqual([]);
    expect(store.mentorSessions()).toEqual([]);
    expect(store.selected()).toBeNull();
    expect(store.loading()).toBeFalse();
    expect(store.error()).toBeNull();
  });

  it('should load learner sessions successfully', () => {
    const response: ApiResponse<PageResponse<SessionDto>> = {
      success: true,
      message: 'Success',
      data: mockPageResponse
    };
    sessionServiceSpy.getLearnerSessions.and.returnValue(of(response));

    store.loadLearnerSessions({ page: 0, size: 10 });

    expect(store.learnerSessions()).toEqual([mockSession]);
    expect(store.learnerTotalElements()).toBe(1);
    expect(store.loading()).toBeFalse();
  });

  it('should handle error when loading learner sessions', () => {
    sessionServiceSpy.getLearnerSessions.and.returnValue(throwError(() => ({ 
      error: { message: 'Failed to load' } 
    })));

    store.loadLearnerSessions({ page: 0, size: 10 });

    expect(store.error()).toBe('Failed to load');
    expect(store.loading()).toBeFalse();
  });

  it('should load mentor sessions successfully', () => {
    const response: ApiResponse<PageResponse<SessionDto>> = {
      success: true,
      message: 'Success',
      data: mockPageResponse
    };
    sessionServiceSpy.getMentorSessions.and.returnValue(of(response));

    store.loadMentorSessions({ page: 0, size: 10 });

    expect(store.mentorSessions()).toEqual([mockSession]);
    expect(store.mentorTotalElements()).toBe(1);
  });

  it('should load session by id', () => {
    const response: ApiResponse<SessionDto> = {
      success: true,
      message: 'Success',
      data: mockSession
    };
    sessionServiceSpy.getSession.and.returnValue(of(response));

    store.loadById(1);

    expect(store.selected()).toEqual(mockSession);
    expect(store.loading()).toBeFalse();
  });

  it('should request a new session', () => {
    const response: ApiResponse<SessionDto> = {
      success: true,
      message: 'Created',
      data: mockSession
    };
    sessionServiceSpy.requestSession.and.returnValue(of(response));

    store.requestSession({ mentorId: 1, skillId: 1, scheduledAt: 'now', durationMinutes: 60 });

    expect(store.learnerSessions()).toContain(mockSession);
  });

  it('should accept a session', () => {
    const response: ApiResponse<SessionDto> = {
      success: true,
      message: 'Accepted',
      data: { ...mockSession, status: 'ACCEPTED' }
    };
    sessionServiceSpy.acceptSession.and.returnValue(of(response));
    sessionServiceSpy.getMentorSessions.and.returnValue(of({ data: mockPageResponse } as unknown as ApiResponse<PageResponse<SessionDto>>));

    store.accept(1);

    expect(store.selected()?.status).toBe('ACCEPTED');
    expect(sessionServiceSpy.getMentorSessions).toHaveBeenCalled();
  });

  it('should reject a session', () => {
    const response: ApiResponse<SessionDto> = {
      success: true,
      message: 'Rejected',
      data: { ...mockSession, status: 'REJECTED' }
    };
    sessionServiceSpy.rejectSession.and.returnValue(of(response));
    sessionServiceSpy.getMentorSessions.and.returnValue(of({ data: mockPageResponse } as unknown as ApiResponse<PageResponse<SessionDto>>));

    store.reject({ id: 1, reason: 'Busy' });

    expect(store.selected()?.status).toBe('REJECTED');
  });

  it('should cancel a session', () => {
    const response: ApiResponse<SessionDto> = {
      success: true,
      message: 'Cancelled',
      data: { ...mockSession, status: 'CANCELLED' }
    };
    sessionServiceSpy.cancelSession.and.returnValue(of(response));
    sessionServiceSpy.getLearnerSessions.and.returnValue(of({ data: mockPageResponse } as unknown as ApiResponse<PageResponse<SessionDto>>));
    sessionServiceSpy.getMentorSessions.and.returnValue(of({ data: mockPageResponse } as unknown as ApiResponse<PageResponse<SessionDto>>));

    store.cancel(1);

    expect(store.selected()?.status).toBe('CANCELLED');
  });

  it('should compute pending mentor sessions', () => {
    const pendingSession = { ...mockSession, status: 'REQUESTED' };
    const acceptedSession = { ...mockSession, id: 2, status: 'ACCEPTED' };
    
    patchState(store, { mentorSessions: [pendingSession, acceptedSession] });

    expect(store.pendingMentorSessions()).toEqual([pendingSession]);
  });

  it('should compute active learner sessions', () => {
    const requested = { ...mockSession, status: 'REQUESTED' };
    const cancelled = { ...mockSession, id: 2, status: 'CANCELLED' };
    
    patchState(store, { learnerSessions: [requested, cancelled] });

    expect(store.activeLearnerSessions()).toEqual([requested]);
  });
});
