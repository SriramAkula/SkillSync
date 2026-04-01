import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SagaResponse, StartSagaRequest, VerifyPaymentRequest } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/payment/payments`;

  startSaga(req: StartSagaRequest): Observable<ApiResponse<SagaResponse>> {
    return this.http.post<ApiResponse<SagaResponse>>(`${this.base}/start-saga`, req);
  }

  getSagaStatus(sessionId: number): Observable<ApiResponse<SagaResponse>> {
    return this.http.get<ApiResponse<SagaResponse>>(`${this.base}/saga/${sessionId}`);
  }

  verifyPayment(req: VerifyPaymentRequest): Observable<ApiResponse<SagaResponse>> {
    return this.http.post<ApiResponse<SagaResponse>>(`${this.base}/verify`, req);
  }

  refund(sessionId: number): Observable<ApiResponse<SagaResponse>> {
    return this.http.post<ApiResponse<SagaResponse>>(`${this.base}/refund`, { sessionId });
  }
}
