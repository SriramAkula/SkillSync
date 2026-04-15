import { TestBed } from '@angular/core/testing';
import { SkillStore } from './skill.store';
import { SkillService } from '../services/skill.service';
import { of } from 'rxjs';
import { ApiResponse, PageResponse, SkillDto } from '../../shared/models';
import { patchState } from '@ngrx/signals';

describe('SkillStore', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;
  let skillServiceSpy: jasmine.SpyObj<SkillService>;

  beforeEach(() => {
    skillServiceSpy = jasmine.createSpyObj('SkillService', ['getAll', 'search']);

    TestBed.configureTestingModule({
      providers: [
        SkillStore,
        { provide: SkillService, useValue: skillServiceSpy }
      ]
    });

    store = TestBed.inject(SkillStore);
  });

  it('should initialize with default state', () => {
    expect(store.skills()).toEqual([]);
    expect(store.loading()).toBeFalse();
    expect(store.currentPage()).toBe(0);
  });

  it('should load all skills', () => {
    const mockRes = {
      data: {
        content: [{ id: 1, skillName: 'Java', category: 'Backend' }],
        currentPage: 0,
        totalElements: 1,
        totalPages: 1,
        pageSize: 12
      }
    };
    skillServiceSpy.getAll.and.returnValue(of(mockRes as ApiResponse<PageResponse<SkillDto>>));

    store.loadAll();

    expect(store.skills().length).toBe(1);
    expect(store.skills()[0].skillName).toBe('Java');
    expect(store.loading()).toBeFalse();
  });

  it('should search skills by keyword', () => {
    const mockRes = {
      data: {
        content: [{ id: 2, skillName: 'Angular', category: 'Frontend' }],
        currentPage: 0,
        totalElements: 1,
        totalPages: 1,
        pageSize: 12
      }
    };
    skillServiceSpy.search.and.returnValue(of(mockRes as ApiResponse<PageResponse<SkillDto>>));

    store.search({ keyword: 'Angular' });

    expect(store.skills().length).toBe(1);
    expect(store.skills()[0].skillName).toBe('Angular');
  });

  it('should load for selection (large batch)', () => {
    const mockSkills = Array(10).fill({}).map((_, i) => ({ id: i, skillName: `Skill ${i}` }));
    skillServiceSpy.getAll.and.returnValue(of({ data: { content: mockSkills } } as ApiResponse<PageResponse<SkillDto>>));

    store.loadForSelection();

    expect(store.skills().length).toBe(10);
  });

  it('should add, update, and remove skills', () => {
    const skill = { id: 10, skillName: 'New' } as unknown as SkillDto;
    store.addSkill(skill);
    expect(store.skills()).toContain(skill);

    const updated = { ...skill, skillName: 'Updated' };
    store.updateSkill(updated);
    expect(store.skills().find((s: SkillDto) => s.id === 10).skillName).toBe('Updated');

    store.removeSkill(10);
    expect(store.skills().length).toBe(0);
  });

  it('should group skills by category correctly', () => {
    const mockSkills = [
      { id: 1, skillName: 'Java', category: 'Backend' },
      { id: 2, skillName: 'Spring', category: 'Backend' },
      { id: 3, skillName: 'Angular', category: 'Frontend' },
      { id: 4, skillName: 'React', category: 'Frontend' },
    ];
    // Set internal state via patchState
    patchState(store, { skills: mockSkills as unknown as SkillDto[] });

    const grouped = store.groupedByCategory();

    expect(grouped.length).toBe(2);
    expect(grouped[0].category).toBe('Backend');
    expect(grouped[0].skills.length).toBe(2);
    expect(grouped[1].category).toBe('Frontend');
  });

  it('should return flat skill names', () => {
    const mockSkills = [
      { id: 1, skillName: 'Java' },
      { id: 2, skillName: 'Angular' },
    ];
    patchState(store, { skills: mockSkills as unknown as SkillDto[] });

    const names = store.skillNames();
    expect(names).toEqual(['Angular', 'Java']);
  });
});
