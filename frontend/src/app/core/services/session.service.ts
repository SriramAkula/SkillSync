import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SessionDto, RequestSessionRequest, PageResponse, SkillDto } from '../../shared/models';
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

  getMentorSessions(page = 0, size = 10): Observable<ApiResponse<PageResponse<SessionDto>>> {
    return this.http.get<ApiResponse<PageResponse<SessionDto>>>(`${this.base}/mentor/list`, {
      params: { page: page.toString(), size: size.toString() }
    }).pipe(
      switchMap(res => this.enrichSessionsPage(res))
    );
  }

  getLearnerSessions(page = 0, size = 10): Observable<ApiResponse<PageResponse<SessionDto>>> {
    return this.http.get<ApiResponse<PageResponse<SessionDto>>>(`${this.base}/learner/list`, {
      params: { page: page.toString(), size: size.toString() }
    }).pipe(
      switchMap(res => this.enrichSessionsPage(res))
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
    return this.enrichSessionsList([s]).pipe(
      map(enriched => ({ ...res, data: enriched[0] }))
    );
  }

  private enrichSessionsPage(res: ApiResponse<PageResponse<SessionDto>>): Observable<ApiResponse<PageResponse<SessionDto>>> {
    const page = res.data;
    if (!page || !page.content || page.content.length === 0) return of(res);

    return this.enrichSessionsList(page.content).pipe(
      map(enriched => ({
        ...res,
        data: { ...page, content: enriched }
      }))
    );
  }

  private enrichSessionsList(sessions: SessionDto[]): Observable<SessionDto[]> {
    if (!sessions || sessions.length === 0) return of(sessions);

    // Get skills (using a larger size to ensure we find matches for enrichment)
    return this.skillService.getAll(0, 50).pipe(
      catchError(err => {
        console.warn('[SessionService] Skill enrichment failed, continuing without names:', err);
        return of({ data: { content: [] } });
      }),
      switchMap(skillRes => {
        // Correctly access .content from the PageResponse
        const skillsData = skillRes.data as PageResponse<SkillDto>;
        const skills = Array.isArray(skillsData?.content) ? skillsData.content : [];
        
        const requests = sessions.map(s => {
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
              const skill = skills.find((sk: SkillDto) => sk.id === s.skillId);
              return {
                ...s,
                mentorName: mentor?.name || mentor?.username || `Mentor #${s.mentorId}`,
                learnerName: learner?.name || learner?.username || `Learner #${s.learnerId}`,
                skillName: skill?.skillName || `Skill #${s.skillId}`
              } as SessionDto;
            })
          );
        });

        return forkJoin(requests);
      })
    );
  }
}
