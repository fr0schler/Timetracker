import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  defaultKey: string;
  currentKey: string;
  category: 'timer' | 'navigation' | 'actions';
}

export default function KeyboardSettings() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(true);

  useEffect(() => {
    // Initialize default shortcuts
    const defaultShortcuts: KeyboardShortcut[] = [
      {
        id: 'start_timer',
        name: t('shortcuts.startTimer'),
        description: t('shortcuts.startTimerDesc'),
        defaultKey: 'F13',
        currentKey: 'F13',
        category: 'timer'
      },
      {
        id: 'stop_timer',
        name: t('shortcuts.stopTimer'),
        description: t('shortcuts.stopTimerDesc'),
        defaultKey: 'F14',
        currentKey: 'F14',
        category: 'timer'
      },
      {
        id: 'switch_project',
        name: t('shortcuts.switchProject'),
        description: t('shortcuts.switchProjectDesc'),
        defaultKey: 'F15',
        currentKey: 'F15',
        category: 'timer'
      },
      {
        id: 'command_palette',
        name: t('shortcuts.commandPalette'),
        description: t('shortcuts.commandPaletteDesc'),
        defaultKey: 'Ctrl+K',
        currentKey: 'Ctrl+K',
        category: 'navigation'
      },
      {
        id: 'new_project',
        name: t('shortcuts.newProject'),
        description: t('shortcuts.newProjectDesc'),
        defaultKey: 'Ctrl+Shift+P',
        currentKey: 'Ctrl+Shift+P',
        category: 'actions'
      },
      {
        id: 'new_task',
        name: t('shortcuts.newTask'),
        description: t('shortcuts.newTaskDesc'),
        defaultKey: 'Ctrl+Shift+T',
        currentKey: 'Ctrl+Shift+T',
        category: 'actions'
      }
    ];

    setShortcuts(defaultShortcuts);
    if (user) {
      setKeyboardShortcutsEnabled(user.keyboard_shortcuts_enabled || false);
    }
  }, [user, t]);

  const handleKeyCapture = (shortcutId: string, event: React.KeyboardEvent) => {
    event.preventDefault();

    const keys: string[] = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.shiftKey) keys.push('Shift');
    if (event.altKey) keys.push('Alt');
    if (event.metaKey) keys.push('Cmd');

    // Add the main key
    if (event.key && !['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
      keys.push(event.key);
    }

    const keyCombo = keys.join('+');

    setShortcuts(prev => prev.map(shortcut =>
      shortcut.id === shortcutId
        ? { ...shortcut, currentKey: keyCombo }
        : shortcut
    ));

    setIsEditing(null);
  };

  const resetToDefault = (shortcutId: string) => {
    setShortcuts(prev => prev.map(shortcut =>
      shortcut.id === shortcutId
        ? { ...shortcut, currentKey: shortcut.defaultKey }
        : shortcut
    ));
  };

  const resetAllToDefaults = () => {
    setShortcuts(prev => prev.map(shortcut => ({
      ...shortcut,
      currentKey: shortcut.defaultKey
    })));
    addToast('success', t('shortcuts.resetSuccess'), t('shortcuts.resetSuccessMessage'));
  };

  const saveShortcuts = async () => {
    try {
      // TODO: Implement API call to save shortcuts
      addToast('success', t('shortcuts.saveSuccess'), t('shortcuts.saveSuccessMessage'));
    } catch (error) {
      addToast('error', t('shortcuts.saveError'), t('shortcuts.saveErrorMessage'));
    }
  };

  const categories = {
    timer: t('shortcuts.timerCategory'),
    navigation: t('shortcuts.navigationCategory'),
    actions: t('shortcuts.actionsCategory')
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <div className="space-y-6">
      {/* Global Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {t('shortcuts.enableShortcuts')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('shortcuts.enableShortcutsDesc')}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={keyboardShortcutsEnabled}
            onChange={(e) => setKeyboardShortcutsEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
        </label>
      </div>

      {/* Shortcuts List */}
      <div className="space-y-6">
        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
          <div key={category}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {categories[category as keyof typeof categories]}
            </h3>
            <div className="space-y-3">
              {categoryShortcuts.map((shortcut) => (
                <div key={shortcut.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {shortcut.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {shortcut.description}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Key Display/Input */}
                    {isEditing === shortcut.id ? (
                      <input
                        type="text"
                        value={t('shortcuts.pressKey')}
                        readOnly
                        onKeyDown={(e) => handleKeyCapture(shortcut.id, e)}
                        onBlur={() => setIsEditing(null)}
                        className="input w-32 text-center bg-yellow-50 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setIsEditing(shortcut.id)}
                        className="px-3 py-1 text-sm font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                        disabled={!keyboardShortcutsEnabled}
                      >
                        {shortcut.currentKey}
                      </button>
                    )}

                    {/* Reset Button */}
                    <button
                      onClick={() => resetToDefault(shortcut.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      disabled={!keyboardShortcutsEnabled || shortcut.currentKey === shortcut.defaultKey}
                      title={t('shortcuts.resetToDefault')}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={resetAllToDefaults}
          className="btn btn-secondary flex items-center space-x-2"
          disabled={!keyboardShortcutsEnabled}
        >
          <RotateCcw className="h-4 w-4" />
          <span>{t('shortcuts.resetAll')}</span>
        </button>

        <button
          onClick={saveShortcuts}
          className="btn btn-primary flex items-center space-x-2"
          disabled={!keyboardShortcutsEnabled}
        >
          <Save className="h-4 w-4" />
          <span>{t('common.save')}</span>
        </button>
      </div>
    </div>
  );
}