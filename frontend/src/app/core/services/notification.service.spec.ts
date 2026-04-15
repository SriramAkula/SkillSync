import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  const mockApiUrl = `${environment.apiUrl}/notification`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService]
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all notifications with pagination', () => {
    service.getAll(0, 10).subscribe();
    const req = httpMock.expectOne(r => r.url === mockApiUrl && r.params.get('page') === '0' && r.params.get('size') === '10');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { content: [] } });
  });

  it('should get unread count', () => {
    service.getUnreadCount().subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/unread/count`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: 5 });
  });

  it('should mark as read', () => {
    service.markAsRead(1).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/1/read`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should delete notification', () => {
    service.delete(1).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
