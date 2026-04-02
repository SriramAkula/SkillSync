import { Injectable, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  /** Reactive signal — true when dark mode is active */
  readonly isDark = signal<boolean>(false);

  constructor() {
    // Load persisted preference or fall back to system preference
    const stored = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = stored ? stored === 'dark' : prefersDark;

    this.isDark.set(initialDark);
    this.applyTheme(initialDark);

    // Reactively persist and apply whenever isDark changes
    effect(() => {
      const dark = this.isDark();
      this.applyTheme(dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update(d => !d);
  }

  setTheme(dark: boolean): void {
    this.isDark.set(dark);
  }

  private applyTheme(dark: boolean): void {
    const root = this.document.documentElement;
    if (dark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }
}
