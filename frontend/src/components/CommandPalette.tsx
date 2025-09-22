import { useState, useEffect } from 'react';
import EnhancedCommandPalette from './CommandPalette/EnhancedCommandPalette';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for global open command
  useEffect(() => {
    const handleOpenCommand = () => {
      setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('open-command-palette', handleOpenCommand);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-command-palette', handleOpenCommand);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <EnhancedCommandPalette
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  );
}