import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionCardComponent } from './session-card.component';
import { SkillStore } from '../../../../core/store/skill.store';
import { AuthStore } from '../../../../core/store/auth.store';
import { signal } from '@angular/core';

describe('SessionCardComponent', () => {
  let component: SessionCardComponent;
  let fixture: ComponentFixture<SessionCardComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSkillStore: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAuthStore: any;

  const mockSession = {
    id: 1,
    skillId: 101,
    learnerId: 1,
    mentorId: 2,
    status: 'ACCEPTED',
    startTime: '2026-05-13T10:00:00Z',
    endTime: '2026-05-13T11:00:00Z'
  };

  beforeEach(async () => {
    mockSkillStore = {
      getSkillById: jasmine.createSpy('getSkillById').and.returnValue({ skillName: 'Angular' })
    };
    mockAuthStore = { userId: signal(1) };

    await TestBed.configureTestingModule({
      imports: [SessionCardComponent],
      providers: [
        { provide: SkillStore, useValue: mockSkillStore },
        { provide: AuthStore, useValue: mockAuthStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SessionCardComponent);
    component = fixture.componentInstance;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component.session = mockSession as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should identify learner correctly', () => {
    expect(component.isLearner).toBeTrue();
    mockAuthStore.userId.set(2);
    expect(component.isLearner).toBeFalse();
  });

  it('should get skill name from store', () => {
    expect(component.skillName).toBe('Angular');
    expect(mockSkillStore.getSkillById).toHaveBeenCalledWith(101);
  });

  it('should handle missing skill gracefully', () => {
    mockSkillStore.getSkillById.and.returnValue(null);
    expect(component.skillName).toBe('Skill #101');
  });

  it('should return correct status mapping', () => {
    expect(component.s.label).toBe('Accepted');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component.session = { ...mockSession, status: 'REJECTED' } as any;
    expect(component.s.label).toBe('Rejected');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component.session = { ...mockSession, status: 'UNKNOWN' } as any;
    expect(component.s.label).toBe('Cancelled'); // default
  });
});
