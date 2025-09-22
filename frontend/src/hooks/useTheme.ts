import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export const useTheme = () => {
  const themeStore = useThemeStore();

  // Apply theme on mount and when system preference changes
  useEffect(() => {
    themeStore.applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeStore.mode === 'system') {
        themeStore.applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeStore.mode]);

  return themeStore;
};

export default useTheme;