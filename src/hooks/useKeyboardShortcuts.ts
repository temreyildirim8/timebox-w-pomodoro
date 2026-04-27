import { useEffect } from "react";
import { shortcutRegistry } from "../utils/keyboardShortcuts";

export function useKeyboardShortcuts(
  key: string,
  handler: (e: KeyboardEvent) => void,
  description: string,
) {
  useEffect(() => {
    shortcutRegistry.register(key, handler, description);
    return () => {
      shortcutRegistry.unregister(key);
    };
  }, [key, handler, description]);
}

export { shortcutRegistry };
