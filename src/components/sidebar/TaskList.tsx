import React, { useState } from "react";
import { Plus, ArrowRight, ArrowLeft } from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskItem } from "./TaskItem";
import type { Task, TimeBlock } from "../../types";

interface TaskListProps {
  title: string;
  placeholder: string;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  type: "today" | "later";
  addTask: (title: string, list: "today" | "later") => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskTitle: (id: string, title: string) => void;
  moveTaskToList: (id: string, list: "today" | "later") => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  title,
  placeholder,
  tasks,
  timeBlocks,
  type,
  addTask,
  toggleTask,
  deleteTask,
  duplicateTask,
  updateTask,
  updateTaskTitle,
  moveTaskToList,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addTask(inputValue.trim(), type);
      setInputValue("");
    }
  };

  const moveTarget = type === "today" ? "later" : "today";
  const MoveIcon = type === "today" ? ArrowRight : ArrowLeft;

  // Sort by order first, then by completed status
  const sortedTasks = [...tasks].sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const taskIds = sortedTasks.map((t) => t.id);

  return (
    <section className="task-list-section">
      <h2 className="task-list-header">{title}</h2>
      <form onSubmit={handleAdd} className="task-input-form">
        <div className="task-input-wrapper">
          <Plus size={16} className="task-input-icon" />
          <input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="task-input"
          />
        </div>
      </form>
      <div className="task-list">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {sortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              timeBlock={timeBlocks.find((b) => b.taskId === task.id)}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              duplicateTask={duplicateTask}
              updateTask={updateTask}
              updateTaskTitle={updateTaskTitle}
              moveTask={() => moveTaskToList(task.id, moveTarget)}
              moveIcon={<MoveIcon size={14} />}
            />
          ))}
        </SortableContext>
      </div>
    </section>
  );
};
