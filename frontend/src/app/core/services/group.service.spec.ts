import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GroupService } from './group.service';
import { environment } from '../../../environments/environment';
import { CreateGroupRequest } from '../../shared/models';

describe('GroupService', () => {
  let service: GroupService;
  let httpMock: HttpTestingController;
  const mockApiUrl = `${environment.apiUrl}/group`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GroupService]
    });
    service = TestBed.inject(GroupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create group', () => {
    const mockReq = { name: 'Test', description: 'desc', skillId: 1, maxMembers: 10 };
    service.createGroup(mockReq as CreateGroupRequest).subscribe();
    const req = httpMock.expectOne(r => r.url === mockApiUrl && r.method === 'POST');
    req.flush({ data: { id: 1 } });
  });

  it('should join group', () => {
    service.joinGroup(1).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/1/join`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should leave group', () => {
    service.leaveGroup(1).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/1/leave`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should get random groups', () => {
    service.getRandomGroups(5).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/random?limit=5`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });
});
