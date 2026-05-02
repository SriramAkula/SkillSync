import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MySessionsPage } from './my-sessions.page';
import { SessionStore } from '../../../../core/store/session.store';
import { SessionService } from '../../../../core/services/session.service';
import { AuthStore } from '../../../../core/store/auth.store';
import { SkillStore } from '../../../../core/store/skill.store';
import { signal } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('MySessionsPage', () => {
  let component: MySessionsPage;
  let fixture: ComponentFixture<MySessionsPage>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSessionStore: any;
  let sessionServiceSpy: jasmine.SpyObj<SessionService>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAuthStore: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSkillStore: any;

  beforeEach(async () => {
    mockSessionStore = {
      learnerSessions: signal([]),
      loading: signal(false),
      error: signal(null),
      learnerTotalElements: signal(0),
      learnerPageSize: signal(12),
      learnerCurrentPage: signal(0),
      loadLearnerSessions: jasmine.createSpy('loadLearnerSessions'),
      cancel: jasmine.createSpy('cancel')
    };
    sessionServiceSpy = jasmine.createSpyObj('SessionService', ['cancel']);
    mockAuthStore = { userId: signal(1) };
    mockSkillStore = {
      skills: signal([]),
      loadAll: jasmine.createSpy('loadAll')
    };

    await TestBed.configureTestingModule({
      imports: [MySessionsPage],
      providers: [
        { provide: SessionStore, useValue: mockSessionStore },
        { provide: SessionService, useValue: sessionServiceSpy },
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: SkillStore, useValue: mockSkillStore }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MySessionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(mockSessionStore.loadLearnerSessions).toHaveBeenCalled();
  });
});
