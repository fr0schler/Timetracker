import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Type, Square, Zap, Eye, Layout } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import { useThemeStore, defaultThemeColors } from '../../store/themeStore';

export default function ThemeSettings() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const {
    mode,
    colorScheme,
    customColors,
    fontSize,
    borderRadius,
    animations,
    compactMode,
    highContrast,
    setMode,
    setColorScheme,
    setCustomColors,
    setFontSize,
    setBorderRadius,
    setAnimations,
    setCompactMode,
    setHighContrast,
    resetToDefaults
  } = useThemeStore();

  const themeOptions = [
    {
      id: 'light',
      name: t('theme.light'),
      description: t('theme.lightDesc'),
      icon: Sun
    },
    {
      id: 'dark',
      name: t('theme.dark'),
      description: t('theme.darkDesc'),
      icon: Moon
    },
    {
      id: 'system',
      name: t('theme.system'),
      description: t('theme.systemDesc'),
      icon: Monitor
    }
  ];

  const colorThemes = Object.entries(defaultThemeColors)
    .filter(([key]) => key !== 'custom')
    .map(([key, theme]) => ({
      id: key,
      ...theme
    }));



  const handleThemeChange = (newMode: string) => {
    setMode(newMode as any);
    addToast('success', t('theme.applied'), t('theme.appliedMessage'));
  };

  const handleColorChange = (colorId: string) => {
    setColorScheme(colorId as any);
    addToast('success', t('theme.colorApplied'), t('theme.colorAppliedMessage'));
  };

  const handleCustomColorChange = (colorType: keyof typeof customColors, value: string) => {
    setCustomColors({ [colorType]: value });
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
                  mode === option.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Icon className={`h-6 w-6 ${
                    mode === option.id
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {colorThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleColorChange(theme.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                colorScheme === theme.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="flex space-x-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.success }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.warning }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.error }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(customColors).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                  {t(`theme.${key}Color`)}
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleCustomColorChange(key as keyof typeof customColors, e.target.value)}
                    className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleCustomColorChange(key as keyof typeof customColors, e.target.value)}
                    className="input flex-1 text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Typography & Layout */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('theme.typography')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Type className="inline w-4 h-4 mr-2" />
              {t('theme.fontSize')}
            </label>
            <div className="space-y-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`w-full p-3 text-left rounded-lg border transition-all ${
                    fontSize === size
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`font-medium ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'}`}>
                    {t(`theme.fontSizes.${size}`)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {size === 'small' ? '14px' : size === 'large' ? '18px' : '16px'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Square className="inline w-4 h-4 mr-2" />
              {t('theme.borderRadius')}
            </label>
            <div className="space-y-2">
              {(['none', 'small', 'medium', 'large'] as const).map((radius) => (
                <button
                  key={radius}
                  onClick={() => setBorderRadius(radius)}
                  className={`w-full p-3 text-left rounded-lg border transition-all ${
                    borderRadius === radius
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={{
                    borderRadius: radius === 'none' ? '0' : radius === 'small' ? '0.25rem' : radius === 'large' ? '1rem' : '0.5rem'
                  }}
                >
                  <div className="font-medium">
                    {t(`theme.borderRadii.${radius}`)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {radius === 'none' ? '0px' : radius === 'small' ? '4px' : radius === 'large' ? '16px' : '8px'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility & UI Options */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('theme.accessibility')}
        </h3>
        <div className="space-y-4">
          {/* Animations */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('theme.animations')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('theme.animationsDesc')}
                </div>
              </div>
            </div>
            <button
              onClick={() => setAnimations(!animations)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                animations ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  animations ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('theme.highContrast')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('theme.highContrastDesc')}
                </div>
              </div>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                highContrast ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center space-x-3">
              <Layout className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('theme.compactMode')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('theme.compactModeDesc')}
                </div>
              </div>
            </div>
            <button
              onClick={() => setCompactMode(!compactMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                compactMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  compactMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={resetToDefaults}
          className="btn btn-secondary"
        >
          {t('theme.resetToDefaults')}
        </button>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('theme.changesAutoSaved')}
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
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-4 h-4 bg-primary-500 rounded"></div>
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <div className="w-4 h-4 bg-red-500 rounded"></div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Font size: {fontSize} | Border radius: {borderRadius} | Animations: {animations ? 'on' : 'off'}
          </div>
        </div>
      </div>
    </div>
  );
}