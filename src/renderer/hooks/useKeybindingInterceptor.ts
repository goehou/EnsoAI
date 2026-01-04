import { useEffect } from 'react';
import { matchesKeybinding } from '@/lib/keybinding';
import { useSettingsStore } from '@/stores/settings';

type KeybindingType = 'closeTab' | 'newTab' | 'nextTab' | 'prevTab' | 'clear' | 'split' | 'merge';

export function useKeybindingInterceptor(
  isActive: boolean,
  keybinding: KeybindingType,
  onMatch: () => void
) {
  const xtermKeybindings = useSettingsStore((s) => s.xtermKeybindings);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement?.hasAttribute('data-keybinding-recording')) {
        return;
      }

      const binding = xtermKeybindings[keybinding];
      if (matchesKeybinding(e, binding)) {
        e.preventDefault();
        e.stopPropagation();
        onMatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, keybinding, xtermKeybindings, onMatch]);
}
