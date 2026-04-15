import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SkillListPage } from './skill-list.page';
import { SkillService } from '../../../../core/services/skill.service';
import { UserService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthStore } from '../../../../core/auth/auth.store';
import { SkillStore } from '../../../../core/auth/skill.store';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ApiResponse, UserProfileDto } from '../../../../shared/models';

describe('SkillListPage', () => {
  let component: SkillListPage;
  let fixture: ComponentFixture<SkillListPage>;
  let skillServiceSpy: jasmine.SpyObj<SkillService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAuthStore: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSkillStore: any;

  beforeEach(async () => {
    skillServiceSpy = jasmine.createSpyObj('SkillService', ['updatePopularity', 'create', 'update', 'delete']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['getMyProfile', 'updateProfile']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    mockAuthStore = {
      isAdmin: signal(false)
    };

    mockSkillStore = {
      skills: signal([{ id: 1, skillName: 'Java', category: 'Backend', popularityScore: 10 }]),
      loading: signal(false),
      totalElements: signal(1),
      currentPage: signal(0),
      loadAll: jasmine.createSpy('loadAll'),
      search: jasmine.createSpy('search'),
      updateSkill: jasmine.createSpy('updateSkill'),
      addSkill: jasmine.createSpy('addSkill'),
      removeSkill: jasmine.createSpy('removeSkill')
    };

    userServiceSpy.getMyProfile.and.returnValue(of({ data: { skills: 'Java, Spring' } } as ApiResponse<UserProfileDto>));

    await TestBed.configureTestingModule({
      imports: [SkillListPage],
      providers: [
        { provide: SkillService, useValue: skillServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: SkillStore, useValue: mockSkillStore },
        { provide: Router, useValue: routerSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SkillListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter skills by category', () => {
    component.filterByCategory('Backend');
    expect(component.selectedCategory()).toBe('Backend');
    const filtered = component.filteredSkills();
    expect(filtered.length).toBe(1);
    expect(filtered[0].skillName).toBe('Java');
  });

  it('should navigate to mentors with query params', () => {
    component.findMentors('Java');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/mentors'], { queryParams: { skill: 'Java' } });
  });

  it('should handle search', () => {
    component.searchQuery = 'React';
    component.onSearch('React');
    expect(component.searchQuery).toBe('React');
  });

  it('should handle pagination', () => {
    component.onPageChange(1);
    expect(mockSkillStore.loadAll).toHaveBeenCalledWith(jasmine.objectContaining({ page: 1 }));
  });

  it('should select skill', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const skill = { id: 1, skillName: 'Java' } as any;
    component.selectSkill(skill);
    expect(component.selectedSkill()).toBe(skill);
  });

  it('should find groups', () => {
    component.findGroups(1);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/groups'], { queryParams: { skillId: 1 } });
  });

  it('should toggle profile skill (add)', fakeAsync(() => {
    // Skills in mock profile: 'Java, Spring'
    // Let's add 'Python' which is NOT in initial profile
    const skill = { id: 3, skillName: 'Python', popularityScore: 5 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userServiceSpy.updateProfile.and.returnValue(of({ success: true } as any));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    skillServiceSpy.updatePopularity.and.returnValue(of({ data: skill } as any));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component.toggleProfileSkill(skill as any);
    tick();
    
    expect(userServiceSpy.updateProfile).toHaveBeenCalled();
    expect(toastServiceSpy.success).toHaveBeenCalledWith(jasmine.stringMatching(/Added/));
  }));

  it('should handle skill creation', fakeAsync(() => {
    component.formData = { skillName: 'New Skill', description: 'Desc', category: 'Cat' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    skillServiceSpy.create.and.returnValue(of({ data: { id: 2, ...component.formData } } as any));
    
    component.saveSkill();
    tick();
    
    expect(skillServiceSpy.create).toHaveBeenCalled();
    expect(mockSkillStore.addSkill).toHaveBeenCalled();
    expect(toastServiceSpy.success).toHaveBeenCalledWith(jasmine.stringMatching(/created/));
  }));

  it('should handle skill deletion error', fakeAsync(() => {
    const error = { error: { message: 'Cannot delete' } };
    skillServiceSpy.delete.and.returnValue(throwError(() => error));
    
    component.deleteSkill(1);
    tick();
    
    expect(toastServiceSpy.error).toHaveBeenCalledWith('Cannot delete');
  }));

  it('should handle skill saving error', fakeAsync(() => {
    component.formData = { skillName: 'New Skill', description: 'Desc', category: 'Cat' };
    skillServiceSpy.create.and.returnValue(throwError(() => ({ error: { message: 'Save failed' } })));
    
    component.saveSkill();
    tick();
    
    expect(toastServiceSpy.error).toHaveBeenCalledWith('Save failed');
    expect(component.saving()).toBeFalse();
  }));
});
