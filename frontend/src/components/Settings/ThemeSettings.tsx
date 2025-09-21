import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColor {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export default function ThemeSettings() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [customColors, setCustomColors] = useState({
    primary: '#3B82F6',
    secondary: '#64748B',
    accent: '#10B981'
  });

  const themeOptions = [
    {
      id: 'light' as ThemeMode,
      name: t('theme.light'),
      description: t('theme.lightDesc'),
      icon: Sun
    },
    {
      id: 'dark' as ThemeMode,
      name: t('theme.dark'),
      description: t('theme.darkDesc'),
      icon: Moon
    },
    {
      id: 'system' as ThemeMode,
      name: t('theme.system'),
      description: t('theme.systemDesc'),
      icon: Monitor
    }
  ];

  const colorThemes: ThemeColor[] = [
    {
      name: t('theme.colors.blue'),
      primary: '#3B82F6',
      secondary: '#64748B',
      accent: '#10B981'
    },
    {
      name: t('theme.colors.purple'),
      primary: '#8B5CF6',
      secondary: '#64748B',
      accent: '#F59E0B'
    },
    {
      name: t('theme.colors.green'),
      primary: '#10B981',
      secondary: '#64748B',
      accent: '#EF4444'
    },
    {
      name: t('theme.colors.orange'),
      primary: '#F97316',
      secondary: '#64748B',
      accent: '#8B5CF6'
    }
  ];

  useEffect(() => {
    // Load saved theme preferences
    const savedTheme = localStorage.getItem('theme-mode') as ThemeMode;
    const savedColor = localStorage.getItem('theme-color');

    if (savedTheme) {
      setThemeMode(savedTheme);
    }
    if (savedColor) {
      setSelectedColor(savedColor);
    }

    // Apply theme based on mode
    applyTheme(savedTheme || 'system');
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;

    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'light') {
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
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('theme-mode', mode);
    applyTheme(mode);

    addToast('success', t('theme.applied'), t('theme.appliedMessage'));
  };

  const handleColorChange = (colorName: string, colors: ThemeColor) => {
    setSelectedColor(colorName);
    localStorage.setItem('theme-color', colorName);

    // Apply color theme to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);

    addToast('success', t('theme.colorApplied'), t('theme.colorAppliedMessage'));
  };

  const handleCustomColorChange = (colorType: keyof typeof customColors, value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [colorType]: value
    }));
  };

  const applyCustomColors = () => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', customColors.primary);
    root.style.setProperty('--color-secondary', customColors.secondary);
    root.style.setProperty('--color-accent', customColors.accent);

    localStorage.setItem('theme-custom-colors', JSON.stringify(customColors));
    setSelectedColor('custom');

    addToast('success', t('theme.customApplied'), t('theme.customAppliedMessage'));
  };

  return (
    <div className="space-y-8">
      {/* Theme Mode Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('theme.mode')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleThemeChange(option.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  themeMode === option.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Icon className={`h-6 w-6 ${
                    themeMode === option.id
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400'
                  }`} />
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Theme Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('theme.colorScheme')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {colorThemes.map((theme, index) => (
            <button
              key={index}
              onClick={() => handleColorChange(theme.name.toLowerCase(), theme)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedColor === theme.name.toLowerCase()
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="flex space-x-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.secondary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.accent }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {theme.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('theme.customColors')}
        </h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('theme.primaryColor')}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={customColors.primary}
                  onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={customColors.primary}
                  onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                  className="input flex-1"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('theme.secondaryColor')}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={customColors.secondary}
                  onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={customColors.secondary}
                  onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                  className="input flex-1"
                  placeholder="#64748B"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('theme.accentColor')}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={customColors.accent}
                  onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={customColors.accent}
                  onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                  className="input flex-1"
                  placeholder="#10B981"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={applyCustomColors}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Palette className="h-4 w-4" />
              <span>{t('theme.applyCustom')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('theme.preview')}
        </h3>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('theme.previewTitle')}
            </h4>
            <div className="flex space-x-2">
              <button className="btn btn-primary btn-sm">Primary</button>
              <button className="btn btn-secondary btn-sm">Secondary</button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('theme.previewDescription')}
          </p>
          <div className="flex items-center space-x-4">
            <div className="w-4 h-4 bg-primary-500 rounded"></div>
            <div className="w-4 h-4 bg-secondary-500 rounded"></div>
            <div className="w-4 h-4 bg-accent-500 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}