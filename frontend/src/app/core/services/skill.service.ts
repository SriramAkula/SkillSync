import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models';
import { SkillDto, CreateSkillRequest } from '../../shared/models/skill.models';

@Injectable({ providedIn: 'root' })
export class SkillService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/skill`;

  getAll(): Observable<ApiResponse<SkillDto[]>> {
    return this.http.get<ApiResponse<SkillDto[]>>(this.base);
  }

  getById(id: number): Observable<ApiResponse<SkillDto>> {
    return this.http.get<ApiResponse<SkillDto>>(`${this.base}/${id}`);
  }

  search(keyword: string): Observable<ApiResponse<SkillDto[]>> {
    return this.http.get<ApiResponse<SkillDto[]>>(`${this.base}/search`, { params: { keyword } });
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
}
