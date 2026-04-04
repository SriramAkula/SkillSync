import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, MentorProfileDto, UserProfileDto,
  ApplyMentorRequest, UpdateAvailabilityRequest
} from '../../shared/models';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class MentorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/mentor`;

  private readonly userService = inject(UserService);

  getApprovedMentors(): Observable<ApiResponse<MentorProfileDto[]>> {
    return this.http.get<ApiResponse<MentorProfileDto[]>>(`${this.base}/approved`).pipe(
      switchMap(res => this.enrichMentors(res))
    );
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

  /** logic to enrich mentor list with user names from user-service */
  private enrichMentors(res: ApiResponse<MentorProfileDto[]>): Observable<ApiResponse<MentorProfileDto[]>> {
    const mentors = res.data || [];
    if (mentors.length === 0) return of(res);

    const userRequests = mentors.map(m => 
      this.userService.getProfile(m.userId).pipe(
        map((uRes: ApiResponse<UserProfileDto>) => ({ mentorId: m.id, user: uRes.data })),
        // Silently handle errors for individual profile fetches
        switchMap(data => of(data))
      )
    );

    return forkJoin(userRequests).pipe(
      map(userProfiles => {
        const enrichedData = mentors.map(m => {
          const profile = userProfiles.find(up => up.mentorId === m.id);
          return {
            ...m,
            user: profile?.user,
            username: profile?.user?.username,
            name: profile?.user?.name || profile?.user?.username || 'Unknown Mentor'
          } as MentorProfileDto;
        });
        return { ...res, data: enrichedData };
      })
    );
  }
}
