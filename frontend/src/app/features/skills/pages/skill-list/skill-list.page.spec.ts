import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SkillListPage } from './skill-list.page';
import { SkillService } from '../../../../core/services/skill.service';
import { UserService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthStore } from '../../../../core/store/auth.store';
import { SkillStore } from '../../../../core/store/skill.store';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ApiResponse, UserProfileDto, SkillDto } from '../../../../shared/models';

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
    const skill = { id: 1, skillName: 'Java' } as unknown as SkillDto;
    component.selectSkill(skill);
    expect(component.selectedSkill()).toBe(skill);
  });

  it('should find groups', () => {
    component.findGroups(1);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/groups'], { queryParams: { skillId: 1 } });
  });

  it('should toggle profile skill (remove)', fakeAsync(() => {
    // Current skills: 'Java, Spring'
    const skill = { id: 1, skillName: 'Java', popularityScore: 10 };
    userServiceSpy.updateProfile.and.returnValue(of({ success: true } as unknown as ApiResponse<UserProfileDto>));
    skillServiceSpy.updatePopularity.and.returnValue(of({ data: skill } as unknown as ApiResponse<SkillDto>));

    component.toggleProfileSkill(skill as unknown as SkillDto);
    tick();
    
    expect(toastServiceSpy.success).toHaveBeenCalledWith(jasmine.stringMatching(/Removed/));
    expect(component.isSkillSelected('Java')).toBeFalse();
  }));

  it('should rollback optimistic update on failure', fakeAsync(() => {
    const skill = { id: 3, skillName: 'Python', popularityScore: 5 };
    userServiceSpy.updateProfile.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

    component.toggleProfileSkill(skill as unknown as SkillDto);
    tick();
    
    expect(toastServiceSpy.error).toHaveBeenCalledWith('Server error');
    expect(component.isSkillSelected('Python')).toBeFalse();
    expect(mockSkillStore.loadAll).toHaveBeenCalled();
  }));

  it('should debounce search input', fakeAsync(() => {
    component.onSearch('Spring');
    tick(200);
    expect(mockSkillStore.search).not.toHaveBeenCalled();
    
    tick(150); // total 350ms
    expect(mockSkillStore.search).toHaveBeenCalledWith(jasmine.objectContaining({ keyword: 'Spring' }));
  }));

  it('should handle pagination with search query', () => {
    component.searchQuery = 'Java';
    component.onPageChange(2);
    expect(mockSkillStore.search).toHaveBeenCalledWith(jasmine.objectContaining({ keyword: 'Java', page: 2 }));
  });

  it('should filter locally by search query', () => {
    mockSkillStore.skills.set([
      { id: 1, skillName: 'Java', category: 'Backend' },
      { id: 2, skillName: 'Angular', category: 'Frontend' }
    ]);
    component.searchQuery = 'ang';
    const filtered = component.filteredSkills();
    expect(filtered.length).toBe(1);
    expect(filtered[0].skillName).toBe('Angular');
  });

  it('should filter locally by My Skills', () => {
    mockSkillStore.skills.set([
      { id: 1, skillName: 'Java', category: 'Backend' },
      { id: 2, skillName: 'Python', category: 'Backend' }
    ]);
    component.selectedSkills.set(['Java']);
    component.showMySkills.set(true);
    
    const filtered = component.filteredSkills();
    expect(filtered.length).toBe(1);
    expect(filtered[0].skillName).toBe('Java');
  });

  it('should clear all filters', () => {
    component.searchQuery = 'Java';
    component.selectedCategory.set('Backend');
    component.showMySkills.set(true);
    
    component.clearAll();
    
    expect(component.searchQuery).toBe('');
    expect(component.selectedCategory()).toBe('');
    expect(component.showMySkills()).toBeFalse();
    expect(mockSkillStore.loadAll).toHaveBeenCalled();
  });

  it('should open edit form with skill data', () => {
    const skill = { id: 1, skillName: 'Java', description: 'Desc', category: 'Backend' };
    component.openEdit(skill as unknown as SkillDto);
    
    expect(component.editingSkill()).toBe(skill as unknown as SkillDto);
    expect(component.formData.skillName).toBe('Java');
    expect(component.showForm()).toBeTrue();
  });

  it('should update existing skill', fakeAsync(() => {
    const skill = { id: 1, skillName: 'Java', description: 'Old', category: 'Backend' };
    component.editingSkill.set(skill as unknown as SkillDto);
    component.formData = { skillName: 'Java', description: 'New', category: 'Backend' };
    
    skillServiceSpy.update.and.returnValue(of({ data: { ...skill, description: 'New' } } as unknown as ApiResponse<SkillDto>));
    
    component.saveSkill();
    tick();
    
    expect(skillServiceSpy.update).toHaveBeenCalledWith(1, jasmine.any(Object));
    expect(mockSkillStore.updateSkill).toHaveBeenCalled();
    expect(toastServiceSpy.success).toHaveBeenCalledWith('Skill updated!');
  }));

  it('should handle skill deletion success', fakeAsync(() => {
    skillServiceSpy.delete.and.returnValue(of({ success: true } as unknown as ApiResponse<void>));
    component.deleteSkill(1);
    tick();
    expect(mockSkillStore.removeSkill).toHaveBeenCalledWith(1);
    expect(toastServiceSpy.success).toHaveBeenCalled();
  }));

  it('should not save skill if name is missing', () => {
    component.formData = { skillName: '', description: '', category: '' };
    component.saveSkill();
    expect(skillServiceSpy.create).not.toHaveBeenCalled();
    expect(skillServiceSpy.update).not.toHaveBeenCalled();
  });
});
