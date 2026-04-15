import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const mockApiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should perform GET request', () => {
    const mockData = { id: 1, name: 'Test' };
    service.get('/test').subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/test`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should perform POST request', () => {
    const mockBody = { name: 'New Item' };
    const mockResponse = { id: 2, ...mockBody };
    service.post('/test', mockBody).subscribe(data => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/test`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockBody);
    req.flush(mockResponse);
  });

  it('should perform PUT request', () => {
    const mockBody = { name: 'Updated Item' };
    service.put('/test/1', mockBody).subscribe(data => {
      expect(data).toEqual(mockBody);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/test/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockBody);
  });

  it('should perform DELETE request', () => {
    service.delete('/test/1').subscribe();

    const req = httpMock.expectOne(`${mockApiUrl}/test/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
