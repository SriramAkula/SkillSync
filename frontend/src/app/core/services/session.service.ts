import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SessionDto, RequestSessionRequest, UserProfileDto } from '../../shared/models';
import { UserService } from './user.service';
import { SkillService } from './skill.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly skillService = inject(SkillService);
  private readonly base = `${environment.apiUrl}/session`;

  requestSession(req: RequestSessionRequest): Observable<ApiResponse<SessionDto>> {
    return this.http.post<ApiResponse<SessionDto>>(`${this.base}/request`, req);
  }

  getSession(id: number): Observable<ApiResponse<SessionDto>> {
    return this.http.get<ApiResponse<SessionDto>>(`${this.base}/${id}`).pipe(
      switchMap(res => this.enrichSingle(res))
    );
  }

  getMentorSessions(): Observable<ApiResponse<SessionDto[]>> {
    return this.http.get<ApiResponse<SessionDto[]>>(`${this.base}/mentor/list`).pipe(
      switchMap(res => this.enrichSessions(res))
    );
  }

  getLearnerSessions(): Observable<ApiResponse<SessionDto[]>> {
    return this.http.get<ApiResponse<SessionDto[]>>(`${this.base}/learner/list`).pipe(
      switchMap(res => this.enrichSessions(res))
    );
  }

  acceptSession(id: number): Observable<ApiResponse<SessionDto>> {
    return this.http.put<ApiResponse<SessionDto>>(`${this.base}/${id}/accept`, null);
  }

  rejectSession(id: number, reason: string): Observable<ApiResponse<SessionDto>> {
    return this.http.put<ApiResponse<SessionDto>>(`${this.base}/${id}/reject`, null, {
      params: { reason }
    });
  }

  cancelSession(id: number): Observable<ApiResponse<SessionDto>> {
    return this.http.put<ApiResponse<SessionDto>>(`${this.base}/${id}/cancel`, null);
  }

  private enrichSingle(res: ApiResponse<SessionDto>): Observable<ApiResponse<SessionDto>> {
    const s = res.data;
    if (!s) return of(res);
    return this.enrichSessions({ ...res, data: [s] }).pipe(
      map(eRes => ({ ...res, data: eRes.data[0] }))
    );
  }

  private enrichSessions(res: ApiResponse<SessionDto[]>): Observable<ApiResponse<SessionDto[]>> {
    const sessions = res.data || [];
    if (sessions.length === 0) return of(res);

    // Get all skills once (they are cached in service anyway)
    return this.skillService.getAll().pipe(
      catchError(() => of({ data: [] })),
      switchMap(skillRes => {
        const skills = (skillRes as any).data || [];
        
        const requests = sessions.map(s => {
          // Fetch Mentor and Learner Profiles
          // Use catchError so one missing profile doesn't break the whole list
          return forkJoin({
            mentor: this.userService.getProfile(s.mentorId).pipe(
              map(r => r.data),
              catchError(() => of(null))
            ),
            learner: this.userService.getProfile(s.learnerId).pipe(
              map(r => r.data),
              catchError(() => of(null))
            )
          }).pipe(
            map(({ mentor, learner }) => {
              const skill = skills.find((sk: any) => sk.id === s.skillId);
              return {
                ...s,
                mentorName: (mentor as any)?.name || (mentor as any)?.username || `Mentor #${s.mentorId}`,
                learnerName: (learner as any)?.name || (learner as any)?.username || `Learner #${s.learnerId}`,
                skillName: skill?.skillName || skill?.name || `Skill #${s.skillId}`
              } as SessionDto;
            })
          );
        });

        return forkJoin(requests).pipe(
          map(enriched => ({ ...res, data: enriched }))
        );
      })
    );
  }
}
