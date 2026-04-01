import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, MentorProfileDto,
  ApplyMentorRequest, UpdateAvailabilityRequest
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class MentorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/mentor`;

  getApprovedMentors(): Observable<ApiResponse<MentorProfileDto[]>> {
    return this.http.get<ApiResponse<MentorProfileDto[]>>(`${this.base}/approved`);
  }

  searchMentors(filters: {
    skill?: string;
    minExperience?: number;
    maxExperience?: number;
    maxRate?: number;
    minRating?: number;
  }): Observable<ApiResponse<MentorProfileDto[]>> {
    let params: any = {};
    if (filters.skill) params.skill = filters.skill;
    if (filters.minExperience != null) params.minExperience = filters.minExperience;
    if (filters.maxExperience != null) params.maxExperience = filters.maxExperience;
    if (filters.maxRate != null) params.maxRate = filters.maxRate;
    if (filters.minRating != null) params.minRating = filters.minRating;
    
    return this.http.get<ApiResponse<MentorProfileDto[]>>(`${this.base}/search`, { params });
  }

  getMentor(id: number): Observable<ApiResponse<MentorProfileDto>> {
    return this.http.get<ApiResponse<MentorProfileDto>>(`${this.base}/${id}`);
  }

  getMyMentorProfile(): Observable<ApiResponse<MentorProfileDto>> {
    return this.http.get<ApiResponse<MentorProfileDto>>(`${this.base}/profile/me`);
  }

  getPendingApplications(): Observable<ApiResponse<MentorProfileDto[]>> {
    return this.http.get<ApiResponse<MentorProfileDto[]>>(`${this.base}/pending`);
  }

  applyAsMentor(req: ApplyMentorRequest): Observable<ApiResponse<MentorProfileDto>> {
    return this.http.post<ApiResponse<MentorProfileDto>>(`${this.base}/apply`, req);
  }

  approveMentor(id: number): Observable<ApiResponse<MentorProfileDto>> {
    return this.http.put<ApiResponse<MentorProfileDto>>(`${this.base}/${id}/approve`, null);
  }

  rejectMentor(id: number): Observable<ApiResponse<MentorProfileDto>> {
    return this.http.put<ApiResponse<MentorProfileDto>>(`${this.base}/${id}/reject`, null);
  }

  suspendMentor(id: number): Observable<ApiResponse<MentorProfileDto>> {
    return this.http.put<ApiResponse<MentorProfileDto>>(`${this.base}/${id}/suspend`, null);
  }

  updateAvailability(req: UpdateAvailabilityRequest): Observable<ApiResponse<MentorProfileDto>> {
    return this.http.put<ApiResponse<MentorProfileDto>>(`${this.base}/availability`, req);
  }
}
