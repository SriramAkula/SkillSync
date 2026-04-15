import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SkillService } from './skill.service';
import { environment } from '../../../environments/environment';
import { CreateSkillRequest } from '../../shared/models';

describe('SkillService', () => {
  let service: SkillService;
  let httpMock: HttpTestingController;
  const mockApiUrl = `${environment.apiUrl}/skill`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SkillService]
    });
    service = TestBed.inject(SkillService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all skills with pagination', () => {
    service.getAll(0, 5).subscribe();
    const req = httpMock.expectOne(r => r.url === mockApiUrl && r.params.get('page') === '0' && r.params.get('size') === '5');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { content: [] } });
  });

  it('should search skills by keyword', () => {
    service.search('Java', 1, 10).subscribe();
    const req = httpMock.expectOne(r => 
      r.url.includes('/search') && 
      r.params.get('keyword') === 'Java' &&
      r.params.get('page') === '1'
    );
    req.flush({ data: { content: [] } });
  });

  it('should fetch by category', () => {
    service.getByCategory('Programming').subscribe();
    const req = httpMock.expectOne(`${mockApiUrl}/category/Programming`);
    req.flush({ data: [] });
  });

  it('should crate, update, and delete skills', () => {
    const skillData = { skillName: 'New Skill', description: 'Desc' };
    
    service.create(skillData as CreateSkillRequest).subscribe();
    httpMock.expectOne(r => r.url === mockApiUrl && r.method === 'POST').flush({});

    service.update(1, skillData as CreateSkillRequest).subscribe();
    httpMock.expectOne(r => r.url === `${mockApiUrl}/1` && r.method === 'PUT').flush({});

    service.delete(1).subscribe();
    httpMock.expectOne(r => r.url === `${mockApiUrl}/1` && r.method === 'DELETE').flush({});
  });

  it('should update popularity', () => {
    service.updatePopularity(1, true).subscribe();
    const req = httpMock.expectOne(r => r.url === `${mockApiUrl}/1/popularity` && r.params.get('increment') === 'true');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
