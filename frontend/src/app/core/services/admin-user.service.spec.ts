import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminUserService } from './admin-user.service';
import { environment } from '../../../environments/environment';

describe('AdminUserService', () => {
  let service: AdminUserService;
  let httpMock: HttpTestingController;
  const mockApiUrl = `${environment.apiUrl}/user/admin`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminUserService]
    });
    service = TestBed.inject(AdminUserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all users with pagination', () => {
    service.getAllUsers(0, 20).subscribe();
    const req = httpMock.expectOne(r => r.url === `${mockApiUrl}/all` && r.params.get('page') === '0' && r.params.get('size') === '20');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { content: [] } });
  });

  it('should get blocked users', () => {
    service.getBlockedUsers().subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/blocked`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('should block a user', () => {
    service.blockUser(1, 'Reason').subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/1/block`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ reason: 'Reason' });
    req.flush({ data: {} });
  });

  it('should unblock a user', () => {
    service.unblockUser(1).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/1/unblock`);
    expect(req.request.method).toBe('PUT');
    req.flush({ data: {} });
  });

  it('should get user details', () => {
    service.getUserDetails(1).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/1/details`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });
});
