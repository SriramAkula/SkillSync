import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';
import { UserProfileDto, UpdateProfileRequest } from '../../shared/models';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const mockApiUrl = `${environment.apiUrl}/user`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle shared user state', () => {
    const mockUser: UserProfileDto = { userId: 1, username: 'testuser', email: 'test@example.com' };
    service.setUser(mockUser);
    expect(service.currentUser).toEqual(mockUser);
    
    let emittedUser: UserProfileDto | null = null;
    service.user$.subscribe(u => emittedUser = u);
    expect(emittedUser as UserProfileDto | null).toEqual(mockUser);
  });

  it('should get my profile and map name to firstName/lastName', () => {
    const mockResponse = {
      success: true,
      data: { userId: 1, username: 'jdoe', name: 'John Doe', email: 'john@example.com' } as UserProfileDto,
      message: 'Success',
      statusCode: 200
    };

    service.getMyProfile().subscribe(res => {
      expect(res.data.firstName).toBe('John');
      expect(res.data.lastName).toBe('Doe');
    });

    const req = httpMock.expectOne(`${mockApiUrl}/profile`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should update profile and push to subject', () => {
    const updateReq = { username: 'newuser' };
    const mockResponse = {
      success: true,
      data: { userId: 1, username: 'newuser', name: 'New Name' } as UserProfileDto,
      message: 'Updated',
      statusCode: 200
    };

    service.updateProfile(updateReq as UpdateProfileRequest).subscribe();

    const req = httpMock.expectOne(`${mockApiUrl}/profile`);
    req.flush(mockResponse);

    expect(service.currentUser?.username).toBe('newuser');
  });

  it('should return placeholder on error for getProfile', () => {
    const userId = 999;
    service.getProfile(userId).subscribe(res => {
      expect(res.data.userId).toBe(userId);
      expect(res.data.name).toBe('Unknown User');
    });

    const req = httpMock.expectOne(`${mockApiUrl}/profile/${userId}`);
    req.error(new ProgressEvent('Network error'));
  });
});
