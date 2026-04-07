import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, AuthResponse, LoginRequest, RegisterRequest,
  OtpRequest, OtpVerifyRequest, ResetPasswordRequest
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;
  private tempEmail: string | null = null;

  setTempEmail(email: string): void {
    this.tempEmail = email;
  }

  getTempEmail(): string | null {
    return this.tempEmail;
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/logout`, null, { withCredentials: true })
      .pipe(
        finalize(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          this.tempEmail = null;
        })
      );
  }

  sendOtp(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/send-otp`, { email });
  }

  verifyOtp(email: string, otp: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/verify-otp`, { email, otp });
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, req, { withCredentials: true });
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, req, { withCredentials: true });
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/refresh`, null, { withCredentials: true });
  }

  sendForgotPasswordOtp(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/forgot-password`, { email });
  }

  verifyForgotPasswordOtp(email: string, otp: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/verify-forgot-password`, { email, otp });
  }

  resetPassword(email: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/reset-password`, { email, newPassword });
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/oauth/google`, { idToken }, { withCredentials: true });
  }
}