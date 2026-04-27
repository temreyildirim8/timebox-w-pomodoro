import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { shortcutRegistry } from '../../utils/keyboardShortcuts';

interface ShortcutsHelpModalProps {
  onClose: () => void;
}

export function ShortcutsHelpModal({ onClose }: ShortcutsHelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const shortcuts = shortcutRegistry.getRegistered();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const displayOrder = ['?', 'F', 'P', 'W', 'N', 'Space', 'Esc', 'T'];
  const sorted = [...shortcuts].sort((a, b) => {
    const ai = displayOrder.indexOf(a.key);
    const bi = displayOrder.indexOf(b.key);
    if (ai === -1 && bi === -1) return a.key.localeCompare(b.key);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shortcuts-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Keyboard Shortcuts</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="shortcuts-list">
          {sorted.map((s) => (
            <div key={s.key} className="shortcut-row">
              <kbd className="shortcut-key">{s.key === ' ' ? 'Space' : s.key}</kbd>
              <span className="shortcut-desc">{s.description}</span>
            </div>
          ))}
          {shortcuts.length === 0 && (
            <div className="empty-hint" style={{ position: 'static' }}>No shortcuts registered</div>
          )}
        </div>
      </div>
    </div>
  );
}
