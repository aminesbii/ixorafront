import { Injectable } from '@angular/core';

export type ThemePreset = 'green' | 'midnight' | 'purple' | 'slate' | 'amber';

export interface ThemeColors {
  primary: string;
  sidebar: string;
  sidebarText: string;
  sidebarTextSecondary: string;
  sidebarHover: string;
  accent: string;
}

export interface AdminPreferences {
  theme: ThemePreset;
  sidebarCollapsed: boolean;
  compactMode: boolean;
  visibleStatCards: string[];
  defaultRowsPerPage: number;
}

const STORAGE_KEY = 'ixora_admin_prefs';

const THEME_PRESETS: Record<ThemePreset, ThemeColors> = {
  green: {
    primary: '#10b981',
    sidebar: '#0a0a0a',
    sidebarText: '#f9fafb',
    sidebarTextSecondary: '#6b7280',
    sidebarHover: '#10b981',
    accent: '#3b82f6',
  },
  midnight: {
    primary: '#1e3a5f',
    sidebar: '#0f1a2e',
    sidebarText: '#e2e8f0',
    sidebarTextSecondary: '#64748b',
    sidebarHover: '#3b82f6',
    accent: '#3b82f6',
  },
  purple: {
    primary: '#7c3aed',
    sidebar: '#1e1029',
    sidebarText: '#ede9fe',
    sidebarTextSecondary: '#7c3aed66',
    sidebarHover: '#a78bfa',
    accent: '#a78bfa',
  },
  slate: {
    primary: '#475569',
    sidebar: '#1e293b',
    sidebarText: '#f1f5f9',
    sidebarTextSecondary: '#64748b',
    sidebarHover: '#38bdf8',
    accent: '#38bdf8',
  },
  amber: {
    primary: '#d97706',
    sidebar: '#1c1917',
    sidebarText: '#fef3c7',
    sidebarTextSecondary: '#a8a29e',
    sidebarHover: '#f59e0b',
    accent: '#f59e0b',
  },
};

const DEFAULT_PREFS: AdminPreferences = {
  theme: 'green',
  sidebarCollapsed: false,
  compactMode: false,
  visibleStatCards: ['Total Projects', 'Active Nodes', 'Monthly Queries', 'Resource Usage'],
  defaultRowsPerPage: 20,
};

@Injectable({ providedIn: 'root' })
export class AdminPrefsService {
  private prefs: AdminPreferences;

  constructor() {
    this.prefs = this.load();
    this.applyTheme();
  }

  private load(): AdminPreferences {
    if (typeof window === 'undefined') return { ...DEFAULT_PREFS };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    try {
      return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs));
  }

  get all(): AdminPreferences {
    return { ...this.prefs };
  }

  get themePreset(): ThemePreset {
    return this.prefs.theme;
  }

  get themeColors(): ThemeColors {
    return THEME_PRESETS[this.prefs.theme];
  }

  get sidebarCollapsed(): boolean {
    return this.prefs.sidebarCollapsed;
  }

  get compactMode(): boolean {
    return this.prefs.compactMode;
  }

  get visibleStatCards(): string[] {
    return this.prefs.visibleStatCards;
  }

  get defaultRowsPerPage(): number {
    return this.prefs.defaultRowsPerPage;
  }

  setTheme(preset: ThemePreset): void {
    this.prefs.theme = preset;
    this.save();
    this.applyTheme();
  }

  setSidebarCollapsed(v: boolean): void {
    this.prefs.sidebarCollapsed = v;
    this.save();
  }

  setCompactMode(v: boolean): void {
    this.prefs.compactMode = v;
    this.save();
  }

  setVisibleStatCards(cards: string[]): void {
    this.prefs.visibleStatCards = cards;
    this.save();
  }

  toggleStatCard(title: string): void {
    const idx = this.prefs.visibleStatCards.indexOf(title);
    if (idx > -1) {
      this.prefs.visibleStatCards.splice(idx, 1);
    } else {
      this.prefs.visibleStatCards.push(title);
    }
    this.save();
  }

  statCardVisible(title: string): boolean {
    return this.prefs.visibleStatCards.includes(title);
  }

  setDefaultRowsPerPage(n: number): void {
    this.prefs.defaultRowsPerPage = n;
    this.save();
  }

  get themePresets(): Record<ThemePreset, ThemeColors> {
    return { ...THEME_PRESETS };
  }

  applyTheme(): void {
    if (typeof window === 'undefined') return;
    const colors = THEME_PRESETS[this.prefs.theme];
    const root = document.documentElement;
    root.style.setProperty('--color-ixora-green', colors.primary);
    root.style.setProperty('--color-sidebar-bg', colors.sidebar);
    root.style.setProperty('--color-sidebar-text', colors.sidebarText);
    root.style.setProperty('--color-sidebar-text-secondary', colors.sidebarTextSecondary);
    root.style.setProperty('--color-sidebar-hover', colors.sidebarHover);
    root.style.setProperty('--color-ixora-blue', colors.accent);
  }

  resetAll(): void {
    this.prefs = { ...DEFAULT_PREFS };
    this.save();
    this.applyTheme();
  }
}
