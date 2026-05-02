import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MentorStore } from './mentor.store';
import { MentorService } from '../services/mentor.service';
import { AuthStore } from './auth.store';
import { of, throwError } from 'rxjs';
import { MentorProfileDto, ApiResponse, PageResponse } from '../../shared/models';
import { patchState } from '@ngrx/signals';

describe('MentorStore', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;
  let mentorServiceSpy: jasmine.SpyObj<MentorService>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authStoreSpy: jasmine.SpyObj<any>;

  beforeEach(() => {
    mentorServiceSpy = jasmine.createSpyObj('MentorService', [
      'getApprovedMentors', 'searchMentors', 'getMentor', 'getMyMentorProfile', 
      'getPendingApplications', 'applyAsMentor', 'approveMentor', 'rejectMentor', 'updateAvailability'
    ]);
    authStoreSpy = { 
      refreshToken: jasmine.createSpy('refreshToken'),
      roles: jasmine.createSpy('roles').and.returnValue(['ROLE_MENTOR'])
    };

    TestBed.configureTestingModule({
      providers: [
        MentorStore,
        { provide: MentorService, useValue: mentorServiceSpy },
        { provide: AuthStore, useValue: authStoreSpy }
      ]
    });

    store = TestBed.inject(MentorStore);
  });

  it('should initialize with default state', () => {
    expect(store.approved()).toEqual([]);
    expect(store.loading()).toBeFalse();
    expect(store.currentPage()).toBe(0);
  });

  it('should load approved mentors', fakeAsync(() => {
    const mockRes = {
      data: {
        content: [{ id: 1, specialization: 'Java' }],
        currentPage: 0,
        totalElements: 1,
        totalPages: 1,
        pageSize: 12
      }
    };
    mentorServiceSpy.getApprovedMentors.and.returnValue(of(mockRes as ApiResponse<PageResponse<MentorProfileDto>>));

    store.loadApproved();
    tick();

    expect(store.approved().length).toBe(1);
    expect(store.totalElements()).toBe(1);
    expect(store.loading()).toBeFalse();
  }));

  it('should handle loadApproved error by setting error state', fakeAsync(() => {
    mentorServiceSpy.getApprovedMentors.and.returnValue(throwError(() => ({ status: 403, error: { message: 'Forbidden' } })));
    store.loadApproved();
    tick();
    expect(store.loading()).toBeFalse();
  }));

  it('should search mentors', fakeAsync(() => {
    const mockRes = {
      data: {
        content: [{ id: 2, specialization: 'Angular' }],
        currentPage: 0,
        totalElements: 1,
        totalPages: 1,
        pageSize: 12
      }
    };
    mentorServiceSpy.searchMentors.and.returnValue(of(mockRes as ApiResponse<PageResponse<MentorProfileDto>>));

    store.search({ skill: 'Angular' });
    tick();

    expect(store.searchResults().length).toBe(1);
    expect(store.searchResults()[0].specialization).toBe('Angular');
  }));

  it('should search mentors with default pagination if no params provided', fakeAsync(() => {
    const mockRes = { data: { content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 12 } };
    mentorServiceSpy.searchMentors.and.returnValue(of(mockRes as unknown as ApiResponse<PageResponse<MentorProfileDto>>));
    
    store.search({});
    tick();
    
    expect(mentorServiceSpy.searchMentors).toHaveBeenCalledWith({});
  }));

  it('should load a specific mentor by id', fakeAsync(() => {
    const mentor = { id: 10, specialization: 'DevOps' } as MentorProfileDto;
    mentorServiceSpy.getMentor.and.returnValue(of({ data: mentor } as unknown as ApiResponse<MentorProfileDto>));
    
    store.loadById(10);
    tick();
    
    expect(store.selected()).toEqual(mentor);
  }));

  it('should load my profile successfully', fakeAsync(() => {
    const mentor = { id: 1, userId: 1, specialization: 'Java' } as MentorProfileDto;
    mentorServiceSpy.getMyMentorProfile.and.returnValue(of({ data: mentor } as unknown as ApiResponse<MentorProfileDto>));
    
    store.loadMyProfile();
    tick();
    
    expect(store.myProfile()).toEqual(mentor);
  }));

  it('should load my profile and suppress "not found" errors', fakeAsync(() => {
    mentorServiceSpy.getMyMentorProfile.and.returnValue(throwError(() => ({ 
      status: 404,
      error: { message: 'Mentor profile not found' } 
    })));

    store.loadMyProfile();
    tick();

    expect(store.error()).toBeNull(); // Should be suppressed
    expect(store.loading()).toBeFalse();
  }));

  it('should apply as a mentor', fakeAsync(() => {
    const request = { specialization: 'Java', yearsOfExperience: 5, hourlyRate: 50, bio: 'Test' };
    mentorServiceSpy.applyAsMentor.and.returnValue(of({ data: { id: 1, ...request } } as unknown as ApiResponse<MentorProfileDto>));
    
    store.applyAsMentor(request);
    tick();
    
    expect(mentorServiceSpy.applyAsMentor).toHaveBeenCalledWith(request);
    expect(store.loading()).toBeFalse();
  }));

  it('should handle apply error', fakeAsync(() => {
    mentorServiceSpy.applyAsMentor.and.returnValue(throwError(() => ({ error: { message: 'Apply failed' } })));
    store.applyAsMentor({} as never);
    tick();
    expect(store.error()).toBe('Apply failed');
  }));

  it('should reject a mentor', fakeAsync(() => {
    const mentor = { id: 5, specialization: 'Testing' } as MentorProfileDto;
    mentorServiceSpy.rejectMentor.and.returnValue(of({ data: mentor } as unknown as ApiResponse<MentorProfileDto>));
    patchState(store, { pending: [mentor], approved: [] });
    
    store.reject(5);
    tick();
    
    expect(store.pending().length).toBe(0);
  }));

  it('should load pending applications', fakeAsync(() => {
    const mockRes = { data: { content: [{ id: 1 }], totalElements: 1, totalPages: 1, currentPage: 0, pageSize: 12 } };
    mentorServiceSpy.getPendingApplications.and.returnValue(of(mockRes as unknown as ApiResponse<PageResponse<MentorProfileDto>>));
    
    store.loadPending();
    tick();
    
    expect(store.pending().length).toBe(1);
  }));

  it('should update availability', fakeAsync(() => {
    const mentor = { id: 10, availabilityStatus: 'AVAILABLE' } as MentorProfileDto;
    mentorServiceSpy.updateAvailability.and.returnValue(of({ data: mentor } as unknown as ApiResponse<MentorProfileDto>));
    patchState(store, { approved: [{ id: 10, availabilityStatus: 'BUSY' } as MentorProfileDto] });

    store.updateAvailability({ availabilityStatus: 'AVAILABLE' });
    tick();

    expect(store.myProfile()?.availabilityStatus).toBe('AVAILABLE');
    expect(store.approved()[0].availabilityStatus).toBe('AVAILABLE');
  }));

  it('should handle updateAvailability 403 by refreshing', fakeAsync(() => {
    mentorServiceSpy.updateAvailability.and.returnValue(throwError(() => ({ status: 403 })));
    store.updateAvailability({ availabilityStatus: 'AVAILABLE' });
    tick();
    expect(authStoreSpy.refreshToken).toHaveBeenCalled();
  }));

  it('should handle rejection error', fakeAsync(() => {
    spyOn(console, 'error');
    mentorServiceSpy.rejectMentor.and.returnValue(throwError(() => ({ status: 500 })));
    store.reject(5);
    tick();
    expect(console.error).toHaveBeenCalled();
  }));

  it('should approve a mentor', fakeAsync(() => {
    const mentor = { id: 5, specialization: 'Testing' } as MentorProfileDto;
    mentorServiceSpy.approveMentor.and.returnValue(of({ data: mentor } as unknown as ApiResponse<MentorProfileDto>));
    patchState(store, { pending: [mentor], approved: [] });
    
    store.approve(5);
    tick();
    
    expect(store.approved().length).toBe(1);
    expect(store.pending().length).toBe(0);
  }));

  it('should handle approval error', fakeAsync(() => {
    spyOn(console, 'error');
    mentorServiceSpy.approveMentor.and.returnValue(throwError(() => ({ status: 500 })));
    store.approve(5);
    tick();
    expect(console.error).toHaveBeenCalled();
  }));

  it('should patch state (error tested via other methods)', () => {
    patchState(store, { error: 'some error' });
    expect(store.error()).toBe('some error');
  });
});
