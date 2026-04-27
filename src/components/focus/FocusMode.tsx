import { useState, useEffect, useCallback } from 'react';
import { Maximize2, X } from 'lucide-react';
import { useAppSettings } from '../../hooks/useAppSettings';

interface FocusModeProps {
  children: React.ReactNode;
}

export function FocusMode({ children }: FocusModeProps) {
  const [isActive, setIsActive] = useState(false);
  const { settings } = useAppSettings();

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  // Expose toggle on window for keyboard shortcuts
  useEffect(() => {
    const win = window as typeof window & { __toggleFocusMode?: () => void };
    win.__toggleFocusMode = toggle;
    return () => {
      delete win.__toggleFocusMode;
    };
  }, [toggle]);

  // beforeunload warning when focus mode is active and setting enabled
  useEffect(() => {
    if (!isActive || !settings.focusWarnOnSwitch) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Focus mode is active. Are you sure you want to leave?';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive, settings.focusWarnOnSwitch]);

  const dimOpacity = Math.max(0, 1 - settings.focusDimLevel / 100);

  return (
    <div className={isActive ? 'focus-mode-active' : ''}>
      {children}
      {isActive && (
        <button className="focus-mode-exit" onClick={toggle} aria-label="Exit focus mode">
          <X size={18} />
          Exit Focus
        </button>
      )}
      {!isActive && (
        <button className="focus-mode-toggle" onClick={toggle} aria-label="Enter focus mode">
          <Maximize2 size={14} />
        </button>
      )}
      <style>{`
        .focus-mode-active .sidebar { opacity: ${dimOpacity}; }
        .focus-mode-active .notes-panel { opacity: ${dimOpacity}; }
      `}</style>
    </div>
  );
}
