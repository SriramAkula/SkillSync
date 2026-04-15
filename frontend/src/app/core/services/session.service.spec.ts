import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SessionService } from './session.service';
import { UserService } from './user.service';
import { SkillService } from './skill.service';
import { of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse, RequestSessionRequest, UserProfileDto, SkillDto } from '../../shared/models';

describe('SessionService', () => {
  let service: SessionService;
  let httpMock: HttpTestingController;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let skillServiceSpy: jasmine.SpyObj<SkillService>;
  const mockApiUrl = `${environment.apiUrl}/session`;

  beforeEach(() => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getProfile']);
    skillServiceSpy = jasmine.createSpyObj('SkillService', ['getAll']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SessionService,
        { provide: UserService, useValue: userServiceSpy },
        { provide: SkillService, useValue: skillServiceSpy }
      ]
    });

    service = TestBed.inject(SessionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request a session', () => {
    const reqData = { mentorId: 1, skillId: 10, scheduledAt: '2024-05-01', durationMinutes: 60 };
    service.requestSession(reqData as RequestSessionRequest).subscribe();

    const req = httpMock.expectOne(`${mockApiUrl}/request`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(reqData);
    req.flush({ success: true });
  });

  it('should get and enrich a single session', () => {
    const mockSession = { id: 101, mentorId: 1, learnerId: 2, skillId: 5 };
    const mockSkillRes = { data: { content: [{ id: 5, skillName: 'Angular' }] } };
    const mockMentorProfile = { data: { name: 'Mentor Name' } };
    const mockLearnerProfile = { data: { name: 'Learner Name' } };

    skillServiceSpy.getAll.and.returnValue(of(mockSkillRes as ApiResponse<PageResponse<SkillDto>>));
    userServiceSpy.getProfile.withArgs(1).and.returnValue(of(mockMentorProfile as ApiResponse<UserProfileDto>));
    userServiceSpy.getProfile.withArgs(2).and.returnValue(of(mockLearnerProfile as ApiResponse<UserProfileDto>));

    service.getSession(101).subscribe(res => {
      expect(res.data.mentorName).toBe('Mentor Name');
      expect(res.data.learnerName).toBe('Learner Name');
      expect(res.data.skillName).toBe('Angular');
    });

    const req = httpMock.expectOne(`${mockApiUrl}/101`);
    req.flush({ success: true, data: mockSession });
  });

  it('should handle skill enrichment failure gracefully', () => {
    const mockSession = { id: 101, mentorId: 1, learnerId: 2, skillId: 5 };
    skillServiceSpy.getAll.and.returnValue(throwError(() => new Error('API Error')));
    userServiceSpy.getProfile.and.returnValue(of({ data: { name: 'Some Name' } } as ApiResponse<UserProfileDto>));

    service.getSession(101).subscribe(res => {
      expect(res.data.skillName).toBe('Skill #5'); // Fallback
      expect(res.data.mentorName).toBe('Some Name');
    });

    const req = httpMock.expectOne(`${mockApiUrl}/101`);
    req.flush({ success: true, data: mockSession });
  });

  it('should handle session actions (accept, reject, cancel)', () => {
    const sessionId = 101;

    service.acceptSession(sessionId).subscribe();
    httpMock.expectOne(`${mockApiUrl}/${sessionId}/accept`).flush({});

    service.rejectSession(sessionId, 'Busy').subscribe();
    const rejectReq = httpMock.expectOne(r => r.url.includes(`/reject`) && r.params.get('reason') === 'Busy');
    rejectReq.flush({});

    service.cancelSession(sessionId).subscribe();
    httpMock.expectOne(`${mockApiUrl}/${sessionId}/cancel`).flush({});
  });
});
