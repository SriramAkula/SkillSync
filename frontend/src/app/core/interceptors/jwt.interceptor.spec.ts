import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthResponse } from '../../shared/models';

describe('jwtInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['refreshToken']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add an Authorization header when token is present', () => {
    const token = 'test-token';
    localStorage.setItem('token', token);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush({});
  });

  it('should NOT add an Authorization header when token is absent', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should handle 401 error and refresh token', () => {
    const oldToken = 'old-token';
    const newToken = 'new-token';
    localStorage.setItem('token', oldToken);
    authServiceSpy.refreshToken.and.returnValue(of({ token: newToken } as AuthResponse));

    httpClient.get('/api/test').subscribe();

    // First attempt
    const req1 = httpMock.expectOne('/api/test');
    req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Refresh call
    expect(authServiceSpy.refreshToken).toHaveBeenCalled();

    // Second attempt with new token
    const req2 = httpMock.expectOne('/api/test');
    expect(req2.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
    req2.flush({ success: true });
    
    expect(localStorage.getItem('token')).toBe(newToken);
  });

  it('should navigate to login if refresh fails', () => {
    localStorage.setItem('token', 'bad-token');
    authServiceSpy.refreshToken.and.returnValue(throwError(() => new Error('Refresh failed')));

    httpClient.get('/api/test').subscribe({
        error: (err) => expect(err).toBeTruthy()
    });

    const req1 = httpMock.expectOne('/api/test');
    req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
