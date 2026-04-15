import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  const THEME_KEY = 'user-theme';

  beforeEach(() => {
    localStorage.clear();
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jasmine.createSpy().and.returnValue({
        matches: false,
        media: '',
        onchange: null,
        addListener: jasmine.createSpy(), // deprecated
        removeListener: jasmine.createSpy(), // deprecated
        addEventListener: jasmine.createSpy(),
        removeEventListener: jasmine.createSpy(),
        dispatchEvent: jasmine.createSpy(),
      }),
    });

    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should be created and initialize with light-theme by default', () => {
    expect(service).toBeTruthy();
    expect(service.theme()).toBe('light-theme');
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
  });

  it('should toggle theme and save to localStorage', () => {
    service.toggleTheme();
    expect(service.theme()).toBe('dark-theme');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark-theme');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();

    service.toggleTheme();
    expect(service.theme()).toBe('light-theme');
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
  });

  it('should initialize with dark-theme if prefers-color-scheme is dark', () => {
    localStorage.clear();
    (window.matchMedia as jasmine.Spy).and.returnValue({ matches: true });
    
    // Create new instance to trigger initTheme
    const darkService = new ThemeService();
    expect(darkService.theme()).toBe('dark-theme');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });

  it('should load saved theme from localStorage', () => {
    localStorage.setItem(THEME_KEY, 'dark-theme');
    const newService = new ThemeService();
    expect(newService.theme()).toBe('dark-theme');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });

  it('should correctly report isDark()', () => {
    expect(service.isDark()).toBeFalse();
    service.toggleTheme();
    expect(service.isDark()).toBeTrue();
  });
});
