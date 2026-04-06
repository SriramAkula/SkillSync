import { Injectable, signal } from '@angular/core';

export type Theme = 'light-theme' | 'dark-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'user-theme';
  
  // Use a signal for reactive theme state
  theme = signal<Theme>('light-theme');

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    if (savedTheme) {
      this.theme.set(savedTheme);
    } else {
      // Optional: Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.set(prefersDark ? 'dark-theme' : 'light-theme');
    }
    this.applyTheme();
  }

  toggleTheme(): void {
    const newTheme: Theme = this.theme() === 'light-theme' ? 'dark-theme' : 'light-theme';
    this.theme.set(newTheme);
    localStorage.setItem(this.THEME_KEY, newTheme);
    this.applyTheme();
  }

  private applyTheme(): void {
    const html = document.documentElement;
    if (this.isDark()) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  isDark(): boolean {
    return this.theme() === 'dark-theme';
  }
}
