import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: number;
  userId: number;
  username: string;
  email: string;
  name: string;
  bio: string;
  phoneNumber: string;
  profileImageUrl: string;
  skills: string;
  rating: number;
  totalReviews: number;
  isProfileComplete: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
  isBlocked: boolean;
  blockReason: string;
  blockDate: string;
  blockedBy: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

export interface PagedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  
  private apiUrl = `${environment.apiUrl}/user`;
  private http = inject(HttpClient);

  /**
   * Get all users with pagination
   */
  getAllUsers(page = 0, size = 20): Observable<ApiResponse<PagedResponse<UserProfile>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<ApiResponse<PagedResponse<UserProfile>>>(`${this.apiUrl}/admin/all`, { params });
  }

  /**
   * Get all blocked users
   */
  getBlockedUsers(): Observable<ApiResponse<UserProfile[]>> {
    return this.http.get<ApiResponse<UserProfile[]>>(`${this.apiUrl}/admin/blocked`);
  }

  /**
   * Block a user
   */
  blockUser(userId: number, reason: string): Observable<ApiResponse<UserProfile>> {
    const body = { reason };
    return this.http.put<ApiResponse<UserProfile>>(`${this.apiUrl}/admin/${userId}/block`, body);
  }

  /**
   * Unblock a user
   */
  unblockUser(userId: number): Observable<ApiResponse<UserProfile>> {
    return this.http.put<ApiResponse<UserProfile>>(`${this.apiUrl}/admin/${userId}/unblock`, {});
  }

  /**
   * Get user details
   */
  getUserDetails(userId: number): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.apiUrl}/admin/${userId}/details`);
  }
}
