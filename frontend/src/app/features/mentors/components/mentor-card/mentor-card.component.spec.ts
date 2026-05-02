import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MentorCardComponent } from './mentor-card.component';
import { AuthStore } from '../../../../core/store/auth.store';
import { Router } from '@angular/router';
import { ReviewService } from '../../../../core/services/review.service';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MentorProfileDto } from '../../../../shared/models';

describe('MentorCardComponent', () => {
  let component: MentorCardComponent;
  let fixture: ComponentFixture<MentorCardComponent>;
  let mockAuthStore: { userId: import('@angular/core').WritableSignal<number | null> };
  let mockRouter: jasmine.SpyObj<Router>;
  let mockReviewService: jasmine.SpyObj<ReviewService>;

  const mockMentor: MentorProfileDto = {
    id: 1,
    userId: 101,
    name: 'Test Mentor',
    username: 'testmentor',
    status: 'APPROVED',
    isApproved: true,
    specialization: 'Angular',
    yearsOfExperience: 5,
    hourlyRate: 50,
    availabilityStatus: 'AVAILABLE',
    rating: 4.5,
    totalStudents: 10,
    createdAt: new Date().toISOString()
  };

  beforeEach(async () => {
    mockAuthStore = {
      userId: signal(100)
    };
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockReviewService = jasmine.createSpyObj('ReviewService', ['getMentorRating']);

    mockReviewService.getMentorRating.and.returnValue(of({
      success: true,
      message: 'Success',
      data: { mentorId: 101, averageRating: 4.8, totalReviews: 10 }
    }));

    await TestBed.configureTestingModule({
      imports: [MentorCardComponent],
      providers: [
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: Router, useValue: mockRouter },
        { provide: ReviewService, useValue: mockReviewService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MentorCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mentor', { ...mockMentor });
    // Note: detectChanges() is called per-test to allow per-test overrides
  });

  it('should create and load rating on init', () => {
    fixture.detectChanges();
    expect(mockReviewService.getMentorRating).toHaveBeenCalledWith(101);
    expect(component.enrichedRating()).toBe(4.8);
    expect(component.enrichedReviewCount()).toBe(10);
  });

  it('should handle rating load error gracefully', () => {
    spyOn(console, 'warn');
    mockReviewService.getMentorRating.and.returnValue(throwError(() => new Error('API Error')));
    fixture.componentRef.setInput('mentor', { ...mockMentor });
    fixture.detectChanges();
    expect(console.warn).toHaveBeenCalled();
    expect(component.enrichedRating()).toBeNull();
  });

  it('should generate initials from name', () => {
    fixture.detectChanges();
    expect(component.initials()).toBe('TM'); // 'Test Mentor' => 'TM'
  });

  it('should fallback to username for initials if name is missing', () => {
    const noName = { ...mockMentor, name: '', username: 'Jane Smith' };
    fixture.componentRef.setInput('mentor', noName);
    expect(component.initials()).toBe('JS');
  });

  it('should fallback to specialization for initials if both name and username missing', () => {
    const noNameUser = { ...mockMentor, name: '', username: '', specialization: 'Expert Mentor' };
    fixture.componentRef.setInput('mentor', noNameUser);
    expect(component.initials()).toBe('EM');
  });

  it('should identify own profile', () => {
    mockAuthStore.userId.set(101); // same as mentor.userId
    const ownProfile = { ...mockMentor, userId: 101 };
    fixture.componentRef.setInput('mentor', ownProfile);
    expect(component.isOwnProfile()).toBeTrue();
  });

  it('should identify other profile', () => {
    mockAuthStore.userId.set(999); // different from mentor.userId (101)
    expect(component.isOwnProfile()).toBeFalse();
  });

  it('should open chat with correct params', () => {
    const chatMentor = { ...mockMentor, userId: 101 };
    fixture.componentRef.setInput('mentor', chatMentor);
    component.openChat();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/messages'], {
      queryParams: { tab: 'direct', directUserId: 101 }
    });
  });

  it('should not open chat if userId is missing', () => {
    const noUser = { ...mockMentor, userId: undefined as unknown as number };
    fixture.componentRef.setInput('mentor', noUser);
    component.openChat();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
