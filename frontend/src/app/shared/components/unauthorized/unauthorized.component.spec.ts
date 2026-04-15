import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UnauthorizedComponent } from './unauthorized.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

describe('UnauthorizedComponent', () => {
  let component: UnauthorizedComponent;
  let fixture: ComponentFixture<UnauthorizedComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authStoreSpy: jasmine.SpyObj<any>;

  beforeEach(async () => {
    authStoreSpy = jasmine.createSpyObj('AuthStore', ['logout']);

    await TestBed.configureTestingModule({
      imports: [UnauthorizedComponent],
      providers: [
        { provide: AuthStore, useValue: authStoreSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ reason: 'mentor' })
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UnauthorizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect stale mentor status from query params', () => {
    expect(component.isMentorStale()).toBeTrue();
  });

  it('should handle re-login by logging out', () => {
    component.relogin();
    expect(authStoreSpy.logout).toHaveBeenCalled();
  });
});
