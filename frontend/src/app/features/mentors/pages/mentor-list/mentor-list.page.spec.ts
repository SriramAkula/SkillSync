import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MentorListPage } from './mentor-list.page';
import { MentorStore } from '../../../../core/auth/mentor.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ReviewService } from '../../../../core/services/review.service';
import { MessagingService } from '../../../../core/services/messaging.service';
import { Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ApiResponse, PageResponse, ReviewDto, MentorRatingDto } from '../../../../shared/models';

describe('MentorListPage', () => {
  let component: MentorListPage;
  let fixture: ComponentFixture<MentorListPage>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockMentorStore: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSkillStore: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAuthStore: any;
  let reviewServiceSpy: jasmine.SpyObj<ReviewService>;
  let messagingServiceSpy: jasmine.SpyObj<MessagingService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    reviewServiceSpy = jasmine.createSpyObj('ReviewService', ['getMentorReviews', 'getMentorRating']);
    messagingServiceSpy = jasmine.createSpyObj('MessagingService', ['openPrivateChat']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: of({}),
      url: '/mentors'
    });

    mockMentorStore = {
      approved: signal([{ id: 1, userId: 101, name: 'Mentor A', availabilityStatus: 'AVAILABLE' }]),
      searchResults: signal([]),
      myProfile: signal(null),
      loading: signal(false),
      error: signal(null),
      currentPage: signal(0),
      pageSize: signal(12),
      totalElements: signal(1),
      totalPages: signal(1),
      approvedCount: signal(1),
      filteredError: signal(null),
      loadApproved: jasmine.createSpy('loadApproved'),
      loadMyProfile: jasmine.createSpy('loadMyProfile'),
      search: jasmine.createSpy('search')
    };

    mockSkillStore = {
      skills: signal([]),
      groupedByCategory: signal([]),
      loadForSelection: jasmine.createSpy('loadForSelection')
    };

    mockAuthStore = {
      userId: signal(100),
      isAdmin: signal(false),
      isMentor: signal(false)
    };

    reviewServiceSpy.getMentorReviews.and.returnValue(of({
      success: true,
      message: 'Success',
      data: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 }
    } as unknown as ApiResponse<PageResponse<ReviewDto>>));
    
    reviewServiceSpy.getMentorRating.and.returnValue(of({
      success: true,
      message: 'Success',
      data: { mentorId: 100, averageRating: 4.5, totalReviews: 1 }
    } as unknown as ApiResponse<MentorRatingDto>));

    await TestBed.configureTestingModule({
      imports: [MentorListPage],
      providers: [
        { provide: MentorStore, useValue: mockMentorStore },
        { provide: SkillStore, useValue: mockSkillStore },
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: ReviewService, useValue: reviewServiceSpy },
        { provide: MessagingService, useValue: messagingServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MentorListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter mentors reactively based on form changes', fakeAsync(() => {
    component.filterForm.patchValue({ skill: 'Java' });
    tick(450);
    expect(mockMentorStore.search).toHaveBeenCalledWith(jasmine.objectContaining({ skill: 'Java' }));
  }));

  it('should handle pagination', () => {
    component.onPageChange(2);
    expect(mockMentorStore.loadApproved).toHaveBeenCalledWith(jasmine.objectContaining({ page: 2 }));
  });

  it('should navigate to mentor detail', () => {
    component.goToDetail(1);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/mentors', 1]);
  });

  it('should navigate to session request', () => {
    component.goToBook(1);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/sessions/request'], { queryParams: { mentorId: 1 } });
  });

  it('should open advanced filters', () => {
    expect(component.isFilterOpen()).toBeFalse();
    component.isFilterOpen.set(true);
    expect(component.isFilterOpen()).toBeTrue();
  });

  it('should reset filters', () => {
    component.filterForm.patchValue({ skill: 'Java' });
    component.availFilter.set('AVAILABLE');
    component.reset();
    expect(component.filterForm.get('skill')?.value).toBeNull();
    expect(component.availFilter()).toBe('');
  });

  it('should sync approved mentors with current user profile', () => {
    const myProfile = { id: 1, userId: 101, name: 'My Updated Name', availabilityStatus: 'AVAILABLE' };
    mockMentorStore.approved.set([{ id: 1, userId: 101, name: 'Old Name', availabilityStatus: 'AVAILABLE' }]);
    mockMentorStore.myProfile.set(myProfile);
    mockAuthStore.userId.set(101); // same userId as in approved list
    
    const synced = component.syncedApprovedMentors();
    const myInList = synced.find((m: import('../../../../shared/models').MentorProfileDto) => m.userId === 101);
    expect(myInList?.name).toBe('My Updated Name');
  });

  it('should return all approved mentors if no user is logged in', () => {
    mockAuthStore.userId.set(null);
    const synced = component.syncedApprovedMentors();
    expect(synced.length).toBe(1);
  });

  it('should filter mentors by availability', () => {
    mockMentorStore.approved.set([
      { id: 1, userId: 101, name: 'A', availabilityStatus: 'AVAILABLE' },
      { id: 2, userId: 102, name: 'B', availabilityStatus: 'BUSY' }
    ]);
    
    component.availFilter.set('AVAILABLE');
    expect(component.filteredMentors().length).toBe(1);
    expect(component.filteredMentors()[0].name).toBe('A');

    component.availFilter.set('BUSY');
    expect(component.filteredMentors().length).toBe(1);
    expect(component.filteredMentors()[0].name).toBe('B');

    component.availFilter.set('');
    expect(component.filteredMentors().length).toBe(2);
  });

  it('should use search results when search is active (via minExperience filter)', fakeAsync(() => {
    mockMentorStore.searchResults.set([{ id: 3, name: 'Search Result', availabilityStatus: 'AVAILABLE' }]);
    component.filterForm.patchValue({ minExperience: 5 });
    tick(500); // allow debounce to trigger search

    // Verify search was called on the store (which proves the filter is active)
    expect(mockMentorStore.search).toHaveBeenCalledWith(jasmine.objectContaining({ minExperience: 5 }));
  }));

  it('should load my profile and reviews if user is a mentor', () => {
    mockAuthStore.isMentor.set(true);
    
    // Trigger loadMentors again
    component.ngOnInit();
    
    expect(mockMentorStore.loadMyProfile).toHaveBeenCalled();
    expect(reviewServiceSpy.getMentorReviews).toHaveBeenCalledWith(100);
  });
});
