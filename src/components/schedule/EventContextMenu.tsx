import { useEffect, useRef, useState } from "react";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react";
import { Play } from "lucide-react";
import { useStore } from "../../hooks/useStore";
import { usePomodoroContext } from "../../contexts/PomodoroContext";

interface EventContextMenuProps {
  x: number;
  y: number;
  blockId: string;
  taskId: string;
  currentTitle: string;
  isCompleted: boolean;
  onClose: () => void;
}

export function EventContextMenu({
  x,
  y,
  blockId,
  taskId,
  currentTitle,
  isCompleted,
  onClose,
}: EventContextMenuProps) {
  const [mode, setMode] = useState<"menu" | "rename">("menu");
  const [newTitle, setNewTitle] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateTimeBlock, updateTask } = useStore();
  const { attachBlock, start } = usePomodoroContext();

  const { refs, floatingStyles } = useFloating({
    open: true,
    middleware: [offset(4), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const setFloating = refs.setFloating;

  useEffect(() => {
    refs.setReference({
      getBoundingClientRect: () => ({
        x,
        y,
        width: 0,
        height: 0,
        top: y,
        left: x,
        right: x,
        bottom: y,
      }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y]);

  useEffect(() => {
    if (mode === "rename" && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [mode]);

  const [menuEl, setMenuEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setFloating(menuEl);
  }, [menuEl, setFloating]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuEl && !menuEl.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, menuEl]);

  const handleRename = () => {
    const trimmed = newTitle.trim();
    if (trimmed && trimmed !== currentTitle) {
      updateTimeBlock(blockId, { title: trimmed });
      updateTask(taskId, { title: trimmed });
    }
    onClose();
  };

  const handleToggleComplete = () => {
    updateTask(taskId, { completed: !isCompleted });
    onClose();
  };

  const handleStartPomodoro = () => {
    attachBlock(blockId, currentTitle, taskId);
    start();
    onClose();
  };

  return (
    <div ref={setMenuEl} style={floatingStyles} className="context-menu">
      {mode === "menu" ? (
        <>
          <button
            className="context-menu-item"
            onClick={() => setMode("rename")}
          >
            Change Name
          </button>
          <button className="context-menu-item" onClick={handleToggleComplete}>
            {isCompleted ? "Mark Unfinished" : "Mark Finished"}
          </button>
          <button className="context-menu-item pomo-start" onClick={handleStartPomodoro}>
            <Play size={14} />
            Start Pomodoro
          </button>
        </>
      ) : (
        <div className="context-menu-rename">
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") onClose();
            }}
            className="context-menu-input"
          />
          <div className="context-menu-actions">
            <button className="context-menu-btn cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="context-menu-btn save" onClick={handleRename}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
