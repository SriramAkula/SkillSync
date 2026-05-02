import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard, roleGuard } from './auth.guard';
import { AuthStore } from '../store/auth.store';
import { signal } from '@angular/core';

describe('AuthGuards', () => {
  let routerSpy: jasmine.SpyObj<Router>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAuthStore: any;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    // Create a mock store with signals
    mockAuthStore = {
      isAuthenticated: signal(false),
      roles: signal<string[]>([]),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthStore, useValue: mockAuthStore }
      ]
    });
  });

  describe('authGuard', () => {
    it('should return true if user is authenticated', () => {
      mockAuthStore.isAuthenticated.set(true);
      const result = TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
      expect(result).toBeTrue();
    });

    it('should redirect back to login if user is NOT authenticated', () => {
      mockAuthStore.isAuthenticated.set(false);
      const result = TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('roleGuard', () => {
    it('should return true if user has the required role', () => {
      mockAuthStore.isAuthenticated.set(true);
      mockAuthStore.roles.set(['ROLE_MENTOR']);
      
      const guard = roleGuard('ROLE_MENTOR');
      const result = TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
      
      expect(result).toBeTrue();
    });

    it('should redirect to unauthorized if user does NOT have the required role', () => {
      mockAuthStore.isAuthenticated.set(true);
      mockAuthStore.roles.set(['ROLE_LEARNER']);
      
      const guard = roleGuard('ROLE_MENTOR');
      const result = TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
      
      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/unauthorized'], { queryParams: { reason: 'mentor' } });
    });

    it('should redirect to login if user is not authenticated', () => {
        mockAuthStore.isAuthenticated.set(false);
        const guard = roleGuard('ROLE_MENTOR');
        const result = TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
        
        expect(result).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });
});
