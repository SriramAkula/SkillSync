import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../../shared/models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const mockApiUrl = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get token from localStorage', () => {
    const token = 'test-token';
    service.setToken(token);
    expect(service.getToken()).toBe(token);
    expect(localStorage.getItem('token')).toBe(token);
  });

  it('should set and get temp email', () => {
    const email = 'test@example.com';
    service.setTempEmail(email);
    expect(service.getTempEmail()).toBe(email);
  });

  it('should login correctly', () => {
    const mockRequest = { email: 'test@example.com', password: 'password' };
    const mockResponse: AuthResponse = { token: 'token', roles: ['ROLE_LEARNER'], email: 'test@example.com' };
    
    service.login(mockRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should logout and clear local storage', () => {
    service.setToken('token');
    service.setTempEmail('test@example.com');
    
    service.logout().subscribe();

    const req = httpMock.expectOne(`${mockApiUrl}/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'Logged out', data: null, statusCode: 200 });

    expect(service.getToken()).toBeNull();
    expect(service.getTempEmail()).toBeNull();
  });

  it('should send OTP correctly', () => {
    const email = 'test@example.com';
    service.sendOtp(email).subscribe();

    const req = httpMock.expectOne(`${mockApiUrl}/send-otp`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email });
    req.flush({ success: true });
  });
});
