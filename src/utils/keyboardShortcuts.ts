type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutEntry {
  key: string;
  handler: ShortcutHandler;
  description: string;
}

function normalizeKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.metaKey) parts.push('meta');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  parts.push(key);
  return parts.join('+');
}

export class ShortcutRegistry {
  private shortcuts: Map<string, ShortcutEntry> = new Map();

  register(key: string, handler: ShortcutHandler, description: string) {
    this.shortcuts.set(key.toLowerCase(), { key: key.toLowerCase(), handler, description });
  }

  unregister(key: string) {
    this.shortcuts.delete(key.toLowerCase());
  }

  getRegistered(): ShortcutEntry[] {
    return Array.from(this.shortcuts.values());
  }

  handleKeyDown(e: KeyboardEvent) {
    // Don't fire when typing in inputs, textareas, or contenteditable
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const normalized = normalizeKey(e);
    const entry = this.shortcuts.get(normalized.toLowerCase());
    if (entry) {
      e.preventDefault();
      entry.handler(e);
    }
  }
}

export const shortcutRegistry = new ShortcutRegistry();
