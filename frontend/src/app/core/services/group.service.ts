import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, GroupDto, CreateGroupRequest, PageResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/group`;

  createGroup(req: CreateGroupRequest): Observable<ApiResponse<GroupDto>> {
    return this.http.post<ApiResponse<GroupDto>>(this.base, req);
  }

  getGroup(id: number): Observable<ApiResponse<GroupDto>> {
    return this.http.get<ApiResponse<GroupDto>>(`${this.base}/${id}`);
  }

  getGroupsBySkill(skillId: number, page: number = 0, size: number = 10): Observable<ApiResponse<PageResponse<GroupDto>>> {
    return this.http.get<ApiResponse<PageResponse<GroupDto>>>(`${this.base}/skill/${skillId}`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  joinGroup(id: number): Observable<ApiResponse<GroupDto>> {
    return this.http.post<ApiResponse<GroupDto>>(`${this.base}/${id}/join`, null);
  }

  leaveGroup(id: number): Observable<ApiResponse<GroupDto>> {
    return this.http.delete<ApiResponse<GroupDto>>(`${this.base}/${id}/leave`);
  }

  deleteGroup(id: number): Observable<ApiResponse<GroupDto>> {
    return this.http.delete<ApiResponse<GroupDto>>(`${this.base}/${id}`);
  }

  getRandomGroups(limit: number = 10): Observable<ApiResponse<GroupDto[]>> {
    return this.http.get<ApiResponse<GroupDto[]>>(`${this.base}/random?limit=${limit}`);
  }
}
