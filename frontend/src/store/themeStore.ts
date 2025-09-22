import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'indigo' | 'pink' | 'teal' | 'custom';

export interface ThemeColor {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface CustomColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeState {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  customColors: CustomColors;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  animations: boolean;
  compactMode: boolean;
  highContrast: boolean;

  // Actions
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setCustomColors: (colors: Partial<CustomColors>) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setBorderRadius: (radius: 'none' | 'small' | 'medium' | 'large') => void;
  setAnimations: (enabled: boolean) => void;
  setCompactMode: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  applyTheme: () => void;
  resetToDefaults: () => void;
}

export const defaultThemeColors: Record<ColorScheme, ThemeColor> = {
  blue: {
    name: 'Blue',
    primary: '#3B82F6',
    secondary: '#64748B',
    accent: '#10B981',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  purple: {
    name: 'Purple',
    primary: '#8B5CF6',
    secondary: '#64748B',
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#8B5CF6'
  },
  green: {
    name: 'Green',
    primary: '#10B981',
    secondary: '#64748B',
    accent: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  orange: {
    name: 'Orange',
    primary: '#F97316',
    secondary: '#64748B',
    accent: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  red: {
    name: 'Red',
    primary: '#EF4444',
    secondary: '#64748B',
    accent: '#10B981',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  indigo: {
    name: 'Indigo',
    primary: '#6366F1',
    secondary: '#64748B',
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#6366F1'
  },
  pink: {
    name: 'Pink',
    primary: '#EC4899',
    secondary: '#64748B',
    accent: '#10B981',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#EC4899'
  },
  teal: {
    name: 'Teal',
    primary: '#14B8A6',
    secondary: '#64748B',
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#14B8A6'
  },
  custom: {
    name: 'Custom',
    primary: '#3B82F6',
    secondary: '#64748B',
    accent: '#10B981',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  }
};

const defaultCustomColors: CustomColors = {
  primary: '#3B82F6',
  secondary: '#64748B',
  accent: '#10B981',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      colorScheme: 'blue',
      customColors: defaultCustomColors,
      fontSize: 'medium',
      borderRadius: 'medium',
      animations: true,
      compactMode: false,
      highContrast: false,

      setMode: (mode) => {
        set({ mode });
        get().applyTheme();
      },

      setColorScheme: (scheme) => {
        set({ colorScheme: scheme });
        get().applyTheme();
      },

      setCustomColors: (colors) => {
        set(state => ({
          customColors: { ...state.customColors, ...colors },
          colorScheme: 'custom'
        }));
        get().applyTheme();
      },

      setFontSize: (fontSize) => {
        set({ fontSize });
        get().applyTheme();
      },

      setBorderRadius: (borderRadius) => {
        set({ borderRadius });
        get().applyTheme();
      },

      setAnimations: (animations) => {
        set({ animations });
        get().applyTheme();
      },

      setCompactMode: (compactMode) => {
        set({ compactMode });
        get().applyTheme();
      },

      setHighContrast: (highContrast) => {
        set({ highContrast });
        get().applyTheme();
      },

      applyTheme: () => {
        const state = get();
        const root = document.documentElement;

        // Apply theme mode
        if (state.mode === 'dark') {
          root.classList.add('dark');
        } else if (state.mode === 'light') {
          root.classList.remove('dark');
        } else {
          // System preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }

        // Apply color scheme
        const colors = state.colorScheme === 'custom'
          ? state.customColors
          : defaultThemeColors[state.colorScheme];

        root.style.setProperty('--color-primary-50', `${colors.primary}0D`);
        root.style.setProperty('--color-primary-100', `${colors.primary}1A`);
        root.style.setProperty('--color-primary-200', `${colors.primary}33`);
        root.style.setProperty('--color-primary-300', `${colors.primary}4D`);
        root.style.setProperty('--color-primary-400', `${colors.primary}66`);
        root.style.setProperty('--color-primary-500', colors.primary);
        root.style.setProperty('--color-primary-600', colors.primary);
        root.style.setProperty('--color-primary-700', colors.primary);
        root.style.setProperty('--color-primary-800', colors.primary);
        root.style.setProperty('--color-primary-900', colors.primary);

        root.style.setProperty('--color-secondary-500', colors.secondary);
        root.style.setProperty('--color-accent-500', colors.accent);
        root.style.setProperty('--color-success-500', colors.success);
        root.style.setProperty('--color-warning-500', colors.warning);
        root.style.setProperty('--color-error-500', colors.error);
        root.style.setProperty('--color-info-500', colors.info);

        // Apply font size
        const fontSizes = {
          small: '14px',
          medium: '16px',
          large: '18px'
        };
        root.style.setProperty('--font-size-base', fontSizes[state.fontSize]);

        // Apply border radius
        const borderRadii = {
          none: '0',
          small: '0.25rem',
          medium: '0.5rem',
          large: '1rem'
        };
        root.style.setProperty('--border-radius-base', borderRadii[state.borderRadius]);

        // Apply other settings
        root.classList.toggle('no-animations', !state.animations);
        root.classList.toggle('compact-mode', state.compactMode);
        root.classList.toggle('high-contrast', state.highContrast);
      },

      resetToDefaults: () => {
        set({
          mode: 'system',
          colorScheme: 'blue',
          customColors: defaultCustomColors,
          fontSize: 'medium',
          borderRadius: 'medium',
          animations: true,
          compactMode: false,
          highContrast: false
        });
        get().applyTheme();
      }
    }),
    {
      name: 'theme-settings',
      version: 1
    }
  )
);