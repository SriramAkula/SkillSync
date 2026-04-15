import { TestBed } from '@angular/core/testing';
import { ProfileCompletionService } from './profile-completion.service';
import { UserProfileDto } from '../../shared/models';

describe('ProfileCompletionService', () => {
  let service: ProfileCompletionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProfileCompletionService]
    });
    service = TestBed.inject(ProfileCompletionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return 0 for null user', () => {
    expect(service.calculateCompletion(null)).toBe(0);
    expect(service.getMissingFields(null)).toEqual([]);
  });

  it('should calculate completion correctly', () => {
    const partialUser: Partial<UserProfileDto> = {
      username: 'test',
      firstName: 'Test',
      lastName: 'User'
      // Missing: bio, phoneNumber, skills, avatarUrl
    };

    // 3/6 fields = 50% of 90 = 45. No avatar bonus.
    expect(service.calculateCompletion(partialUser as UserProfileDto)).toBe(45);

    const fullUser: Partial<UserProfileDto> = {
      username: 'test',
      firstName: 'Test',
      lastName: 'User',
      bio: 'My bio',
      phoneNumber: '1234567890',
      skills: 'Java',
      avatarUrl: 'http://avatar.com'
    };

    // 6/6 fields = 100% of 90 + 10 bonus = 100%
    expect(service.calculateCompletion(fullUser as UserProfileDto)).toBe(100);
  });

  it('should identify missing fields', () => {
    const partialUser: Partial<UserProfileDto> = {
      username: 'test',
      firstName: 'Test'
    };

    const missing = service.getMissingFields(partialUser as UserProfileDto);
    expect(missing.map(m => m.key)).toContain('lastName');
    expect(missing.map(m => m.key)).toContain('bio');
    expect(missing.map(m => m.key)).toContain('phoneNumber');
    expect(missing.map(m => m.key)).toContain('skills');
    expect(missing.length).toBe(4);
  });

  it('should handle empty strings and arrays in isFilled', () => {
    const userWithEmptyFields: Partial<UserProfileDto> = {
      username: ' ', // Empty after trim
      skills: [] as unknown as string // Mocking empty array for string field
    };

    const missing = service.getMissingFields(userWithEmptyFields as UserProfileDto);
    expect(missing.map(m => m.key)).toContain('username');
    expect(missing.map(m => m.key)).toContain('skills');
  });
});
