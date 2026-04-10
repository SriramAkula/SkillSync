import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models';
import { PageResponse } from '../../shared/models/page.models';
import { SkillDto, CreateSkillRequest } from '../../shared/models/skill.models';

@Injectable({ providedIn: 'root' })
export class SkillService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/skill`;

  getAll(page: number = 0, size: number = 12): Observable<ApiResponse<PageResponse<SkillDto>>> {
    return this.http.get<ApiResponse<PageResponse<SkillDto>>>(this.base, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getById(id: number): Observable<ApiResponse<SkillDto>> {
    return this.http.get<ApiResponse<SkillDto>>(`${this.base}/${id}`);
  }

  search(keyword: string, page: number = 0, size: number = 12): Observable<ApiResponse<PageResponse<SkillDto>>> {
    return this.http.get<ApiResponse<PageResponse<SkillDto>>>(`${this.base}/search`, { 
      params: { keyword, page: page.toString(), size: size.toString() } 
    });
  }

  getByCategory(category: string): Observable<ApiResponse<SkillDto[]>> {
    return this.http.get<ApiResponse<SkillDto[]>>(`${this.base}/category/${category}`);
  }

  create(req: CreateSkillRequest): Observable<ApiResponse<SkillDto>> {
    return this.http.post<ApiResponse<SkillDto>>(this.base, req);
  }

  update(id: number, req: CreateSkillRequest): Observable<ApiResponse<SkillDto>> {
    return this.http.put<ApiResponse<SkillDto>>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }

  updatePopularity(id: number, increment: boolean): Observable<ApiResponse<SkillDto>> {
    return this.http.put<ApiResponse<SkillDto>>(`${this.base}/${id}/popularity`, null, { params: { increment } });
  }
}
