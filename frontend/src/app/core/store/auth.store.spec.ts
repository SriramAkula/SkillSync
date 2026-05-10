import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthStore } from './auth.store';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { patchState } from '@ngrx/signals';
import { AuthResponse, ApiResponse } from '../../shared/models';

describe('AuthStore', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'register', 'refreshToken', 'logout', 'sendOtp', 'googleLogin', 'verifyOtp']);
    authServiceSpy.logout.and.returnValue(of({ success: true } as ApiResponse<void>));
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    store = TestBed.inject(AuthStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default state', () => {
    expect(store.token()).toBeNull();
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.loading()).toBeFalse();
  });

  it('should update state on successful login', fakeAsync(() => {
    const mockRes: AuthResponse = {
      token: 'fake.jwt.token',
      roles: ['ROLE_LEARNER'],
      username: 'testuser',
      email: 'test@example.com'
    };
    
    spyOn(window, 'atob').and.returnValue(JSON.stringify({ userId: 123, roles: ['ROLE_LEARNER'], sub: 'test@example.com' }));
    authServiceSpy.login.and.returnValue(of(mockRes));

    store.login({ email: 'test@example.com', password: 'password' });
    tick();

    expect(store.token()).toBe('fake.jwt.token');
    expect(store.isAuthenticated()).toBeTrue();
    expect(store.roles()).toContain('ROLE_LEARNER');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/mentors']);
  }));

  it('should handle login error', fakeAsync(() => {
    authServiceSpy.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));

    store.login({ email: 'test@example.com', password: 'wrong' });
    tick();

    expect(store.loading()).toBeFalse();
    expect(store.error()).toBe('Invalid credentials');
    expect(store.isAuthenticated()).toBeFalse();
  }));

  it('should handle successful registration', fakeAsync(() => {
    const mockRes = { token: 'mock.jwt.token', userId: 1, email: 'new@test.com', roles: ['ROLE_LEARNER'] };
    authServiceSpy.register.and.returnValue(of(mockRes as unknown as AuthResponse));
    
    store.register({ email: 'new@test.com', password: 'pass' });
    tick();
    
    expect(authServiceSpy.register).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/verify-otp'], { queryParams: { email: 'new@test.com' } });
  }));

  it('should handle registration error', fakeAsync(() => {
    authServiceSpy.register.and.returnValue(throwError(() => ({ error: { message: 'User exists' } })));
    store.register({ email: 'fail@test.com', password: 'p' });
    tick();
    expect(store.error()).toBe('User exists');
  }));

  it('should handle logout and clear state', fakeAsync(() => {
    authServiceSpy.logout.and.returnValue(of(null) as unknown as ReturnType<typeof authServiceSpy.logout>);
    patchState(store, { token: 'test-token', userId: 1, email: 't@t.com', username: 'u' });
    
    store.logout();
    tick();

    expect(store.token()).toBeNull();
    expect(store.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('token')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  }));

  it('should handle sendOtp successfully', fakeAsync(() => {
    authServiceSpy.sendOtp.and.returnValue(of({ success: true } as unknown as ApiResponse<void>));
    store.sendOtp('test@test.com', true);
    tick();
    expect(authServiceSpy.sendOtp).toHaveBeenCalled();
  }));

  it('should handle googleLogin successfully', fakeAsync(() => {
    const mockResponse: AuthResponse = { token: 'g-token', roles: ['ROLE_LEARNER'], username: 'guser', email: 'g@g.com' };
    spyOn(window, 'atob').and.returnValue(JSON.stringify({ userId: 5, roles: ['ROLE_LEARNER'], sub: 'g@g.com' }));
    authServiceSpy.googleLogin.and.returnValue(of(mockResponse));
    
    store.googleLogin('auth-code');
    tick();
    
    expect(store.token()).toBe('g-token');
    expect(store.isAuthenticated()).toBeTrue();
  }));

  it('should handle refreshToken successfully', fakeAsync(() => {
    authServiceSpy.refreshToken.and.returnValue(of({ data: 'new-token' }) as unknown as ReturnType<typeof authServiceSpy.refreshToken>);
    store.refreshToken();
    tick();
    expect(authServiceSpy.refreshToken).toHaveBeenCalled();
  }));

  it('should handle refreshToken failure', fakeAsync(() => {
    authServiceSpy.refreshToken.and.returnValue(throwError(() => ({ status: 401 })));
    patchState(store, { token: 'old-token' });
    store.refreshToken();
    tick();
    expect(store.token()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  }));

  it('should add role', () => {
    patchState(store, { roles: ['ROLE_LEARNER'] });
    store.addRole('ROLE_MENTOR');
    expect(store.roles()).toContain('ROLE_MENTOR');
    expect(localStorage.getItem('roles')).toContain('ROLE_MENTOR');
  });

  it('should update user info', () => {
    store.updateUser('New Name', 'newuser');
    expect(store.username()).toBe('newuser');
    expect(localStorage.getItem('username')).toBe('newuser');
    expect(localStorage.getItem('name')).toBe('New Name');
  });

  it('should correctly compute isMentor and isAdmin signals', () => {
    patchState(store, { roles: ['ROLE_LEARNER'] });
    expect(store.isMentor()).toBeFalse();
    expect(store.isLearner()).toBeTrue();

    patchState(store, { roles: ['ROLE_MENTOR'] });
    expect(store.isMentor()).toBeTrue();

    patchState(store, { roles: ['ROLE_ADMIN'] });
    expect(store.isAdmin()).toBeTrue();
  });

  it('should handle login error for user not found', fakeAsync(() => {
    authServiceSpy.login.and.returnValue(throwError(() => ({ error: { message: 'User not found' } })));
    store.login({ email: 'unknown@test.com', password: 'p' });
    tick();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/register'], jasmine.any(Object));
    expect(store.error()).toContain('User not found');
  }));

  it('should handle login error for invalid password', fakeAsync(() => {
    authServiceSpy.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid password' } })));
    store.login({ email: 't@t.com', password: 'p' });
    tick();
    expect(store.error()).toContain('Invalid password');
  }));

  it('should navigate to mentor dashboard if user is mentor', fakeAsync(() => {
    const mockRes: AuthResponse = { token: 't', roles: ['ROLE_MENTOR'], username: 'm', email: 'm@m.com' };
    spyOn(window, 'atob').and.returnValue(JSON.stringify({ roles: ['ROLE_MENTOR'] }));
    authServiceSpy.login.and.returnValue(of(mockRes));
    
    store.login({ email: 'm@m.com', password: 'p' });
    tick();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/mentor-dashboard']);
  }));

  it('should handle googleLogin error', fakeAsync(() => {
    authServiceSpy.googleLogin.and.returnValue(throwError(() => ({ error: { message: 'G-Fail' } })));
    store.googleLogin('code');
    tick();
    expect(store.error()).toBe('G-Fail');
  }));

  it('should navigate to admin users if user is admin', fakeAsync(() => {
    const mockRes: AuthResponse = { token: 't', roles: ['ROLE_ADMIN'], username: 'a', email: 'a@a.com' };
    spyOn(window, 'atob').and.returnValue(JSON.stringify({ roles: ['ROLE_ADMIN'] }));
    authServiceSpy.login.and.returnValue(of(mockRes));
    
    store.login({ email: 'a@a.com', password: 'p' });
    tick();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/users']);
  }));

  it('should handle decodeJwt failure gracefully', fakeAsync(() => {
    const mockRes: AuthResponse = { token: 'invalid.token.here', roles: ['ROLE_LEARNER'], username: 'u', email: 'u@u.com' };
    authServiceSpy.login.and.returnValue(of(mockRes));
    
    // atob will fail or JSON.parse will fail
    store.login({ email: 'u@u.com', password: 'p' });
    tick();
    
    expect(store.token()).toBe('invalid.token.here');
    expect(store.roles()).toEqual(['ROLE_LEARNER']);
  }));

  it('should not add role if it already exists', () => {
    patchState(store, { roles: ['ROLE_LEARNER'] });
    store.addRole('ROLE_LEARNER');
    expect(store.roles().length).toBe(1);
  });

  it('should correctly compute canApplyToBeMentor', () => {
    patchState(store, { roles: ['ROLE_LEARNER'] });
    expect(store.canApplyToBeMentor()).toBeTrue();

    patchState(store, { roles: ['ROLE_LEARNER', 'ROLE_MENTOR'] });
    expect(store.canApplyToBeMentor()).toBeFalse();
  });

  it('should handle verifyOtp successfully', fakeAsync(() => {
    authServiceSpy.verifyOtp.and.returnValue(of({ success: true } as unknown as ApiResponse<void>));
    store.verifyOtp({ email: 't@t.com', otp: '1234' });
    tick();
    expect(store.otpVerified()).toBeTrue();
  }));

  it('should handle verifyOtp error', fakeAsync(() => {
    authServiceSpy.verifyOtp.and.returnValue(throwError(() => ({ error: { message: 'Wrong OTP' } })));
    store.verifyOtp({ email: 't@t.com', otp: '0000' });
    tick();
    expect(store.error()).toBe('Wrong OTP');
  }));

  it('should use claims if res.roles is missing during registration', fakeAsync(() => {
    const mockRes = { token: 't' }; // Missing roles/email/username
    spyOn(window, 'atob').and.returnValue(JSON.stringify({ userId: 1, roles: ['ROLE_LEARNER'], sub: 'claim@test.com' }));
    authServiceSpy.register.and.returnValue(of(mockRes as unknown as AuthResponse));
    
    store.register({ email: 'test@test.com', password: 'p' });
    tick();
    
    expect(store.roles()).toEqual(['ROLE_LEARNER']);
    expect(store.email()).toBe('claim@test.com');
  }));

  it('should clear error', () => {
    patchState(store, { error: 'err' });
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
