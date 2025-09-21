import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { useTimeEntryStore } from '../store/timeEntryStore';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
  global?: boolean; // Works even when input is focused
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, currentProject, setCurrentProject } = useProjectStore();
  const { activeEntry, startTimer, stopTimer } = useTimeEntryStore();
  const shortcutsRef = useRef<ShortcutConfig[]>([]);

  // Core shortcuts
  const shortcuts: ShortcutConfig[] = [
    // Navigation
    {
      key: 'h',
      ctrlKey: true,
      action: () => navigate('/'),
      description: 'Go to Dashboard',
      global: true
    },
    {
      key: 'p',
      ctrlKey: true,
      action: () => navigate('/projects'),
      description: 'Go to Projects',
      global: true
    },
    {
      key: 't',
      ctrlKey: true,
      action: () => navigate('/time-entries'),
      description: 'Go to Time Entries',
      global: true
    },

    // Timer controls
    {
      key: ' ', // Spacebar
      action: () => {
        if (activeEntry) {
          stopTimer(activeEntry.id);
        } else if (currentProject) {
          startTimer(currentProject.id);
        }
      },
      description: 'Start/Stop Timer',
      global: true
    },

    // Project switching
    {
      key: 'ArrowUp',
      action: () => switchProject(-1),
      description: 'Previous Project',
      global: false
    },
    {
      key: 'ArrowDown',
      action: () => switchProject(1),
      description: 'Next Project',
      global: false
    },

    // Quick actions
    {
      key: 'n',
      ctrlKey: true,
      action: () => navigate('/projects/new'),
      description: 'New Project',
      global: true
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => openCommandPalette(),
      description: 'Open Command Palette',
      global: true
    },

    // Hardware keyboard support (F-keys)
    {
      key: 'F13',
      action: () => switchProject(-1),
      description: 'Previous Project (Hardware)',
      global: true
    },
    {
      key: 'F14',
      action: () => switchProject(1),
      description: 'Next Project (Hardware)',
      global: true
    },
    {
      key: 'F15',
      action: () => {
        if (activeEntry) {
          stopTimer(activeEntry.id);
        } else if (currentProject) {
          startTimer(currentProject.id);
        }
      },
      description: 'Start/Stop Timer (Hardware)',
      global: true
    }
  ];

  const switchProject = useCallback((direction: number) => {
    if (!projects.length) return;

    const currentIndex = projects.findIndex(p => p.id === currentProject?.id);
    let nextIndex = currentIndex + direction;

    if (nextIndex < 0) nextIndex = projects.length - 1;
    if (nextIndex >= projects.length) nextIndex = 0;

    setCurrentProject(projects[nextIndex]);
  }, [projects, currentProject, setCurrentProject]);

  const openCommandPalette = useCallback(() => {
    // Implement command palette modal
    const event = new CustomEvent('open-command-palette');
    window.dispatchEvent(event);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if user has keyboard shortcuts disabled
    if (!user?.keyboard_shortcuts_enabled) return;

    // Skip if typing in input/textarea (unless global shortcut)
    const target = event.target as HTMLElement;
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
                          target.contentEditable === 'true';

    for (const shortcut of shortcuts) {
      // Check if shortcut should be skipped when input is focused
      if (isInputFocused && !shortcut.global) continue;

      // Check key combination
      const keyMatch = event.key === shortcut.key || event.code === shortcut.key;
      const ctrlMatch = (shortcut.ctrlKey || false) === event.ctrlKey;
      const altMatch = (shortcut.altKey || false) === event.altKey;
      const shiftMatch = (shortcut.shiftKey || false) === event.shiftKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        break;
      }
    }
  }, [user, shortcuts, switchProject, openCommandPalette]);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Global hotkey for opening PWA (works system-wide)
  useEffect(() => {
    const registerGlobalHotkey = () => {
      // This would require Electron or browser extension
      // For now, we'll register service worker for when PWA is installed
      if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        navigator.serviceWorker.ready.then(registration => {
          // Register global hotkey through service worker
          registration.active?.postMessage({
            type: 'REGISTER_GLOBAL_HOTKEY',
            hotkey: 'Ctrl+Shift+T', // Global shortcut to open TimeTracker
            action: 'OPEN_PWA'
          });
        });
      }
    };

    registerGlobalHotkey();
  }, []);

  return {
    shortcuts: shortcutsRef.current,
    switchProject,
    openCommandPalette
  };
};