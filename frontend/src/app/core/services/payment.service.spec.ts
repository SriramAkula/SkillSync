import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';
import { environment } from '../../../environments/environment';
import { StartSagaRequest, VerifyPaymentRequest } from '../../shared/models';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;
  const mockApiUrl = `${environment.apiUrl}/payment/payments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentService]
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start saga', () => {
    const mockReq = { sessionId: 1, mentorId: 1, learnerId: 1, durationMinutes: 60 };
    service.startSaga(mockReq as StartSagaRequest).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/start-saga`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockReq);
    req.flush({ data: { status: 'STARTED' } });
  });

  it('should get saga status', () => {
    service.getSagaStatus(1).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/saga/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { status: 'COMPLETED' } });
  });

  it('should verify payment', () => {
    const mockReq = { sessionId: 1, razorpayOrderId: 'oid', razorpayPaymentId: 'pid', razorpaySignature: 'sig' };
    service.verifyPayment(mockReq as VerifyPaymentRequest).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/verify`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: { status: 'SUCCESS' } });
  });

  it('should handle refund', () => {
    service.refund(1).subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/refund`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ sessionId: 1 });
    req.flush({ data: { status: 'REFUNDED' } });
  });
});
