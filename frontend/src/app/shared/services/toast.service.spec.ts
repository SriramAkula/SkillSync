import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a toast and emit via observable', () => {
    service.success('Success message');
    
    service.toasts$.subscribe(toasts => {
      if (toasts.length > 0) {
        expect(toasts.length).toBe(1);
        expect(toasts[0].message).toBe('Success message');
        expect(toasts[0].type).toBe('success');
      }
    });
  });

  it('should handle different toast types', () => {
    service.error('Error');
    service.info('Info');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toasts = (service as any).toastsSubject.value;
    expect(toasts.length).toBe(2);
    expect(toasts[0].type).toBe('error');
    expect(toasts[1].type).toBe('info');
  });

  it('should remove a toast manually', () => {
    service.show('Test', 'info');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toastId = (service as any).toastsSubject.value[0].id;
    
    service.remove(toastId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((service as any).toastsSubject.value.length).toBe(0);
  });

  it('should auto-remove toast after 3 seconds', fakeAsync(() => {
    service.success('Auto remove test');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((service as any).toastsSubject.value.length).toBe(1);
    
    tick(3000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((service as any).toastsSubject.value.length).toBe(0);
  }));
});
