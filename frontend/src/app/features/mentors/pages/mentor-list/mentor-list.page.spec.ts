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
      isAdmin: signal(false)
    };

    reviewServiceSpy.getMentorReviews.and.returnValue(of({ data: { content: [] } } as unknown as ApiResponse<PageResponse<ReviewDto>>));
    reviewServiceSpy.getMentorRating.and.returnValue(of({ data: { averageRating: 4.5 } } as unknown as ApiResponse<MentorRatingDto>));

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
});
