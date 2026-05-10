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

  it('should verify OTP correctly', () => {
    const email = 'test@example.com';
    const otp = '123456';
    service.verifyOtp(email, otp).subscribe();

    const req = httpMock.expectOne(`${mockApiUrl}/verify-otp`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email, otp });
    req.flush({ success: true });
  });

  it('should register correctly', () => {
    const mockRequest = { email: 'new@test.com', password: 'password', name: 'New User' };
    const mockResponse: AuthResponse = { token: 'token', roles: ['ROLE_LEARNER'], email: 'new@test.com' };
    
    service.register(mockRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should refresh token correctly', () => {
    const mockResponse: AuthResponse = { token: 'new-token', roles: ['ROLE_LEARNER'], email: 'test@test.com' };
    
    service.refreshToken().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/refresh`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should handle forgot password flow', () => {
    const email = 'reset@test.com';
    const otp = '654321';
    const newPassword = 'new-password';

    // sendForgotPasswordOtp
    service.sendForgotPasswordOtp(email).subscribe();
    const req1 = httpMock.expectOne(`${mockApiUrl}/forgot-password`);
    expect(req1.request.body).toEqual({ email });
    req1.flush({ success: true });

    // verifyForgotPasswordOtp
    service.verifyForgotPasswordOtp(email, otp).subscribe();
    const req2 = httpMock.expectOne(`${mockApiUrl}/verify-forgot-password`);
    expect(req2.request.body).toEqual({ email, otp });
    req2.flush({ success: true });

    // resetPassword
    service.resetPassword(email, newPassword).subscribe();
    const req3 = httpMock.expectOne(`${mockApiUrl}/reset-password`);
    expect(req3.request.body).toEqual({ email, newPassword });
    req3.flush({ success: true });
  });

  it('should handle google login', () => {
    const idToken = 'google-id-token';
    const mockResponse: AuthResponse = { token: 'token', roles: ['ROLE_LEARNER'], email: 'g@test.com' };
    
    service.googleLogin(idToken).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${mockApiUrl}/oauth/google`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idToken });
    req.flush(mockResponse);
  });
});
