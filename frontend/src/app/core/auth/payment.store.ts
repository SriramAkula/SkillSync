import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import { PaymentService } from '../services/payment.service';
import { SagaResponse, StartSagaRequest, VerifyPaymentRequest } from '../../shared/models';

interface PaymentState {
  saga: SagaResponse | null;
  loading: boolean;
  error: string | null;
}

export const PaymentStore = signalStore(
  { providedIn: 'root' },
  withState<PaymentState>({ saga: null, loading: false, error: null }),

  withMethods((store: any, svc = inject(PaymentService)) => ({

    startSaga: rxMethod<StartSagaRequest>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((req: any) =>
          svc.startSaga(req).pipe(
            tapResponse({
              next: (res) => patchState(store, { saga: res.data, loading: false }),
              error: (err: any) => {
                if (err.status === 409) {
                  patchState(store, { loading: true });
                  (store as any).loadSaga(req.sessionId);
                } else {
                  patchState(store, { loading: false, error: err.error?.message || 'Failed to start payment' });
                }
              }
            })
          )
        )
      )
    ),

    loadSaga: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((sessionId: any) =>
          svc.getSagaStatus(sessionId).pipe(
            tapResponse({
              next: (res) => patchState(store, { saga: res.data, loading: false }),
              error: () => patchState(store, { loading: false })
            })
          )
        )
      )
    ),

    verifyPayment: rxMethod<VerifyPaymentRequest>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((req: any) =>
          svc.verifyPayment(req).pipe(
            tapResponse({
              next: (res) => patchState(store, { saga: res.data, loading: false }),
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message ?? 'Payment verification failed' })
            })
          )
        )
      )
    ),

    reset: () => patchState(store, { saga: null, loading: false, error: null })
  }))
);
