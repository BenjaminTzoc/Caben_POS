import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'app_theme_mode';
  public isDarkMode = signal<boolean>(this.getInitialTheme() === 'dark');

  constructor() {
    this.applyTheme(this.isDarkMode() ? 'dark' : 'light');
  }

  public toggleTheme(): void {
    const newMode: ThemeMode = this.isDarkMode() ? 'light' : 'dark';
    this.setTheme(newMode);
  }

  public setTheme(mode: ThemeMode): void {
    this.isDarkMode.set(mode === 'dark');
    localStorage.setItem(this.STORAGE_KEY, mode);
    this.applyTheme(mode);
  }

  private applyTheme(mode: ThemeMode): void {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private getInitialTheme(): ThemeMode {
    const stored = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return 'light';
  }
}
