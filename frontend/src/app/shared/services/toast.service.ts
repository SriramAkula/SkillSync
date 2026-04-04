import { Injectable } from '@angular/core';
import { BehaviorSubject, delay, of } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  private counter = 0;

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = ++this.counter;
    const toast = { message, type, id };
    
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    // Auto remove after 3 seconds
    of(null).pipe(delay(3000)).subscribe(() => {
      this.remove(id);
    });
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  info(message: string) {
    this.show(message, 'info');
  }

  remove(id: number) {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
  }
}
