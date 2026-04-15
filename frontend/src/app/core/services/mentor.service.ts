import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, MentorProfileDto, UserProfileDto,
  ApplyMentorRequest, UpdateAvailabilityRequest
} from '../../shared/models';
import { PageResponse } from '../../shared/models/page.models';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class MentorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/mentor`;

  private readonly userService = inject(UserService);

  getApprovedMentors(page = 0, size = 12): Observable<ApiResponse<PageResponse<MentorProfileDto>>> {
    return this.http.get<ApiResponse<PageResponse<MentorProfileDto>>>(`${this.base}/approved`, {
      params: { page: page.toString(), size: size.toString() }
    }).pipe(
      switchMap(res => this.enrichMentors(res))
    );
  }

  searchMentors(filters: {
    skill?: string;
    minExperience?: number;
    maxExperience?: number;
    maxRate?: number;
    minRating?: number;
    page?: number;
    size?: number;
  }): Observable<ApiResponse<PageResponse<MentorProfileDto>>> {
    const params: Record<string, string | number> = {};
    if (filters.skill) params['skill'] = filters.skill;
    if (filters.minExperience != null) params['minExperience'] = filters.minExperience;
    if (filters.maxExperience != null) params['maxExperience'] = filters.maxExperience;
    if (filters.maxRate != null) params['maxRate'] = filters.maxRate;
    if (filters.minRating != null) params['minRating'] = filters.minRating;

    if (filters.page != null) params['page'] = filters.page.toString();
    if (filters.size != null) params['size'] = filters.size.toString();

    return this.http.get<ApiResponse<PageResponse<MentorProfileDto>>>(`${this.base}/search`, { params }).pipe(
      switchMap(res => this.enrichMentors(res))
    );
  }

  getMentor(id: number): Observable<ApiResponse<MentorProfileDto>> {
    return this.http.get<ApiResponse<MentorProfileDto>>(`${this.base}/${id}`).pipe(
      switchMap(res => this.enrichSingleMentor(res))
    );
  }

  getMyMentorProfile(): Observable<ApiResponse<MentorProfileDto | null>> {
    return this.http.get<ApiResponse<MentorProfileDto>>(`${this.base}/profile/me`).pipe(
      switchMap(res => {
        if (!res.data) return of(res as ApiResponse<MentorProfileDto | null>);
        return this.enrichSingleMentor(res).pipe(
          map(enriched => enriched as ApiResponse<MentorProfileDto | null>)
        );
      })
    );
  }

  private enrichSingleMentor(res: ApiResponse<MentorProfileDto>): Observable<ApiResponse<MentorProfileDto>> {
    const mentor = res.data;
    if (!mentor) return of(res);

    return this.userService.getProfile(mentor.userId).pipe(
      map(uRes => {
        const user = uRes.data;
        return {
          ...res,
          data: {
            ...mentor,
            user,
            username: user?.username,
            name: user?.name || user?.username || 'Mentor'
          }
        };
      })
    );
  }

  getPendingApplications(page = 0, size = 12): Observable<ApiResponse<PageResponse<MentorProfileDto>>> {
    return this.http.get<ApiResponse<PageResponse<MentorProfileDto>>>(`${this.base}/pending`, {
      params: { page: page.toString(), size: size.toString() }
    });
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
  private enrichMentors(res: ApiResponse<PageResponse<MentorProfileDto>>): Observable<ApiResponse<PageResponse<MentorProfileDto>>> {
    const pageData = res.data;
    const mentors = pageData?.content || [];
    if (mentors.length === 0) return of(res);

    const userRequests = mentors.map(m =>
      this.userService.getProfile(m.userId).pipe(
        map((uRes: ApiResponse<UserProfileDto>) => ({ mentorId: m.id, user: uRes.data })),
        switchMap(data => of(data))
      )
    );

    return forkJoin(userRequests).pipe(
      map(userProfiles => {
        const enrichedContent = mentors.map(m => {
          const profile = userProfiles.find(up => up.mentorId === m.id);
          return {
            ...m,
            user: profile?.user,
            username: profile?.user?.username,
            name: profile?.user?.name || profile?.user?.username || 'Unknown Mentor'
          } as MentorProfileDto;
        });
        
        const enrichedPage = { ...pageData, content: enrichedContent } as PageResponse<MentorProfileDto>;
        return { ...res, data: enrichedPage };
      })
    );
  }
}
