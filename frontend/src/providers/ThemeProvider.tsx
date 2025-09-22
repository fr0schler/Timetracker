import React, { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { applyTheme } = useThemeStore();

  useEffect(() => {
    // Apply theme on mount
    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [applyTheme]);

  return <>{children}</>;
};

export default ThemeProvider;