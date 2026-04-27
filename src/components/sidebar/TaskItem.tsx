import React, { useState, useEffect, useRef } from "react";
import {
  Trash2,
  CheckCircle,
  Circle,
  GripVertical,
  Clock,
  Palette,
  Copy,
} from "lucide-react";
import { formatTime } from "../../utils/timeFormat";
import { ChromePicker, type ColorResult } from "react-color";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
  useHover,
  safePolygon,
  useRole,
} from "@floating-ui/react";
import type { Task, TimeBlock } from "../../types";

interface TaskItemProps {
  task: Task;
  timeBlock?: TimeBlock;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskTitle: (id: string, title: string) => void;
  moveTask: () => void;
  moveIcon: React.ReactNode;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  timeBlock,
  toggleTask,
  deleteTask,
  duplicateTask,
  updateTask,
  updateTaskTitle,
  moveTask,
  moveIcon,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Sortable functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Prevent text selection while color picker is open/being dragged
  useEffect(() => {
    if (isPickerOpen) {
      document.body.classList.add("picker-open");
    } else {
      document.body.classList.remove("picker-open");
    }
    return () => {
      document.body.classList.remove("picker-open");
    };
  }, [isPickerOpen]);

  // Focus input when editing
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleEditStart = () => {
    setEditTitle(task.title);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      updateTaskTitle(task.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditSave();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  // Color Picker Floating Logic
  const {
    refs: pickerRefs,
    floatingStyles: pickerStyles,
    context: pickerContext,
  } = useFloating({
    open: isPickerOpen,
    onOpenChange: setIsPickerOpen,
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
    placement: "right-start",
  });

  // Tooltip Floating Logic
  const {
    refs: tooltipRefs,
    floatingStyles: tooltipStyles,
    context: tooltipContext,
  } = useFloating({
    open: isTooltipOpen,
    onOpenChange: setIsTooltipOpen,
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
    placement: "top-start",
  });

  const pickerClick = useClick(pickerContext);
  const pickerDismiss = useDismiss(pickerContext);
  const {
    getReferenceProps: getPickerProps,
    getFloatingProps: getPickerFloatingProps,
  } = useInteractions([pickerClick, pickerDismiss]);

  const tooltipHover = useHover(tooltipContext, {
    delay: 300,
    handleClose: safePolygon(),
  });
  const tooltipRole = useRole(tooltipContext, { role: "tooltip" });
  const {
    getReferenceProps: getTooltipProps,
    getFloatingProps: getTooltipFloatingProps,
  } = useInteractions([tooltipHover, tooltipRole]);

  const handleColorChange = (color: ColorResult) => {
    const { r, g, b, a } = color.rgb;
    updateTask(task.id, { color: `rgba(${r}, ${g}, ${b}, ${a})` });
  };

  return (
    <div
      ref={setNodeRef}
      className="draggable-task-item task-item-container"
      data-task-id={task.id}
      data-title={task.title}
      {...attributes}
      style={{
        ...style,
        borderLeft: `4px solid ${task.color || "#204784"}`,
      }}
    >
      <div className="task-item-content">
        <button
          className="task-item-duplicate-btn"
          onClick={() => duplicateTask(task.id)}
          title="Duplicate task"
        >
          <Copy size={14} />
        </button>

        <div
          ref={tooltipRefs.setReference}
          className="task-item-drag-handle"
          title={task.title}
          {...getTooltipProps()}
          {...listeners}
        >
          <GripVertical size={14} />
        </div>

        {isTooltipOpen && (
          <FloatingPortal>
            <div
              // eslint-disable-next-line react-hooks/refs
              ref={tooltipRefs.setFloating}
              style={tooltipStyles}
              className="task-tooltip"
              {...getTooltipFloatingProps()}
            >
              {task.title}
            </div>
          </FloatingPortal>
        )}

        <button
          className="task-item-toggle"
          onClick={() => toggleTask(task.id)}
        >
          {task.completed ? (
            <CheckCircle
              size={18}
              color="#22c55e"
              fill="#22c55e"
              fillOpacity={0.2}
            />
          ) : (
            <Circle size={18} color="var(--text-secondary)" />
          )}
        </button>

        <div className="task-item-body">
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              className="task-edit-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={handleEditKeyDown}
            />
          ) : (
            <div
              className={`task-item-title ${task.completed ? "completed" : ""}`}
              onDoubleClick={handleEditStart}
              title="Double-click to edit"
            >
              {task.title}
            </div>
          )}
          {timeBlock && (
            <div className="task-item-time">
              <Clock size={10} />
              {formatTime(timeBlock.startTime)}
            </div>
          )}
        </div>

        <div className="task-actions">
          <div className="relative-container">
            <button
              ref={pickerRefs.setReference}
              {...getPickerProps()}
              title="Change color"
              className="action-btn"
            >
              <Palette size={14} />
            </button>
            {isPickerOpen && (
              <FloatingPortal>
                <div
                  // eslint-disable-next-line react-hooks/refs
                  ref={pickerRefs.setFloating}
                  style={{ ...pickerStyles, zIndex: 99999 }}
                  {...getPickerFloatingProps()}
                >
                  <ChromePicker
                    color={task.color || "#204784"}
                    onChange={handleColorChange}
                    disableAlpha={false}
                  />
                </div>
              </FloatingPortal>
            )}
          </div>
          <button className="action-btn" onClick={moveTask} title="Move task">
            {moveIcon}
          </button>
          <button
            className="action-btn"
            onClick={() => deleteTask(task.id)}
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
