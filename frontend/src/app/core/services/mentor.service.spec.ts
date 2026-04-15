import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MentorService } from './mentor.service';
import { UserService } from './user.service';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, UserProfileDto, ApplyMentorRequest, PageResponse, MentorProfileDto } from '../../shared/models';

describe('MentorService', () => {
  let service: MentorService;
  let httpMock: HttpTestingController;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  const mockApiUrl = `${environment.apiUrl}/mentor`;

  beforeEach(() => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getProfile']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MentorService,
        { provide: UserService, useValue: userServiceSpy }
      ]
    });

    service = TestBed.inject(MentorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch approved mentors and enrich them', () => {
    const mockMentors = {
      success: true,
      data: {
        content: [
          { id: 1, userId: 101, specialization: 'Java' },
          { id: 2, userId: 102, specialization: 'Angular' }
        ],
        totalElements: 2
      }
    };

    const mockProfile1 = { data: { userId: 101, username: 'user1', name: 'User One' } };
    const mockProfile2 = { data: { userId: 102, username: 'user2', name: 'User Two' } };

    userServiceSpy.getProfile.withArgs(101).and.returnValue(of(mockProfile1 as ApiResponse<UserProfileDto>));
    userServiceSpy.getProfile.withArgs(102).and.returnValue(of(mockProfile2 as ApiResponse<UserProfileDto>));

    service.getApprovedMentors().subscribe(res => {
      expect(res.data.content[0].name).toBe('User One');
      expect(res.data.content[1].username).toBe('user2');
      expect(userServiceSpy.getProfile).toHaveBeenCalledTimes(2);
    });

    const req = httpMock.expectOne(request => request.url.includes('/approved'));
    req.flush(mockMentors);
  });

  it('should apply filters in searchMentors', () => {
    const filters = { skill: 'Java', minExperience: 5 };
    service.searchMentors(filters).subscribe();

    const req = httpMock.expectOne(r => 
      r.url.includes('/search') && 
      r.params.get('skill') === 'Java' && 
      r.params.get('minExperience') === '5'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { content: [] } } as unknown as ApiResponse<PageResponse<MentorProfileDto>>);
  });

  it('should handle applyAsMentor', () => {
    const applyReq = { specialization: 'testing', yearsOfExperience: 3, hourlyRate: 50, bio: 'bio' };
    service.applyAsMentor(applyReq as ApplyMentorRequest).subscribe();

    const req = httpMock.expectOne(`${mockApiUrl}/apply`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(applyReq);
    req.flush({ success: true });
  });

  it('should handle approve/reject/suspend actions', () => {
    const mentorId = 1;
    
    service.approveMentor(mentorId).subscribe();
    httpMock.expectOne(`${mockApiUrl}/${mentorId}/approve`).flush({});

    service.rejectMentor(mentorId).subscribe();
    httpMock.expectOne(`${mockApiUrl}/${mentorId}/reject`).flush({});

    service.suspendMentor(mentorId).subscribe();
    httpMock.expectOne(`${mockApiUrl}/${mentorId}/suspend`).flush({});
  });
});
