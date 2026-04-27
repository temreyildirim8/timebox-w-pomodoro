import React, { useEffect, useRef } from "react";
import {
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { Draggable } from "@fullcalendar/interaction";
import { Download, Upload, Settings } from "lucide-react";
import { exportDB, importDB } from "dexie-export-import";
import { db } from "../../db/db";
import type { Task, TimeBlock } from "../../types";
import { TaskList } from "./TaskList";
import { showToast } from "../ui/Toast";

interface SidebarProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  addTask: (title: string, list: "today" | "later") => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskTitle: (id: string, title: string) => void;
  moveTaskToList: (id: string, list: "today" | "later") => void;
  reorderTasks: (activeId: string, overId: string) => void;
  selectedDate: string;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tasks,
  timeBlocks,
  addTask,
  toggleTask,
  deleteTask,
  duplicateTask,
  updateTask,
  updateTaskTitle,
  moveTaskToList,
  reorderTasks,
  selectedDate,
  onOpenSettings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(active.id as string, over.id as string);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      const draggable = new Draggable(containerRef.current, {
        itemSelector: ".draggable-task-item",
        eventData: function (eventEl: Element) {
          return {
            title: eventEl.getAttribute("data-title"),
            duration: "00:20",
            extendedProps: {
              taskId: eventEl.getAttribute("data-task-id"),
            },
          };
        },
      });
      return () => draggable.destroy();
    }
  }, []);

  const { setNodeRef, isOver } = useDroppable({
    id: "sidebar-droppable",
  });

  const handleExport = async () => {
    try {
      const blob = await exportDB(db);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timebox-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Backup exported successfully", "success");
    } catch (error) {
      console.error("Export failed:", error);
      showToast("Backup failed. Please try again.", "error");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // For a full restore that overwrites everything correctly:
      // 1. Delete the current database
      // 2. Import the new database from the file
      await db.delete();
      await importDB(file);
      window.location.reload();
    } catch (error) {
      console.error("Import failed:", error);
      showToast(
        "Restore failed. Make sure you selected a valid backup file.",
        "error",
      );
      // Re-open current db if possible if import failed
      try {
        await db.open();
      } catch {
        // Database reopen failed, continuing without cached data
      }
    }
  };

  const todayTasks = tasks.filter(
    (t) => t.list === "today" && t.date === selectedDate,
  );
  const laterTasks = tasks.filter((t) => t.list === "later");

  return (
    <aside
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node as HTMLDivElement | null;
      }}
      className={`sidebar ${isOver ? "sidebar-droppable-active" : ""}`}
    >
      <div className="sidebar-header animate-in delay-1">
        <h1 className="sidebar-title" style={{ flex: 1 }}>
          Timebox
        </h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            className="action-btn"
            onClick={handleExport}
            title="Export Backup"
          >
            <Upload size={18} />
          </button>
          <button
            className="action-btn"
            onClick={handleImportClick}
            title="Import Restore"
          >
            <Download size={18} />
          </button>
          <button
            className="action-btn"
            onClick={onOpenSettings}
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept=".json"
          />
        </div>
      </div>

      <div
        className="scrollable sidebar-content animate-in delay-2"
        style={{
          transform: `scale(1)`,
          transformOrigin: "top center",
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <TaskList
            title="Today"
            placeholder="Add task to today..."
            tasks={todayTasks}
            timeBlocks={timeBlocks}
            type="today"
            addTask={addTask}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            duplicateTask={duplicateTask}
            updateTask={updateTask}
            updateTaskTitle={updateTaskTitle}
            moveTaskToList={moveTaskToList}
          />

          <TaskList
            title="Later"
            placeholder="Brain dump..."
            tasks={laterTasks}
            timeBlocks={timeBlocks}
            type="later"
            addTask={addTask}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            duplicateTask={duplicateTask}
            updateTask={updateTask}
            updateTaskTitle={updateTaskTitle}
            moveTaskToList={moveTaskToList}
          />
        </DndContext>
      </div>
    </aside>
  );
};
