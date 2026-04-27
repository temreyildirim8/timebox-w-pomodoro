import { useState, useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";
import { db } from "../db/db";
import type { Task, TimeBlock } from "../types";

// Goal types for the store
interface WeeklyGoal {
  id: string;
  weekStart: string;
  title: string;
  target: number;
  current: number;
  type: 'tasks' | 'hours' | 'pomodoros';
  completed: boolean;
}

export function useStore() {
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );

  // Reactive data from Dexie
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const timeBlocks = useLiveQuery(() => db.timeBlocks.toArray(), []) || [];
  const notesArray = useLiveQuery(() => db.notes.toArray(), []) || [];

  // Convert notes array to record for backward compatibility
  const notes = useMemo(() => {
    return notesArray.reduce(
      (acc, note) => {
        acc[note.date] = note.content;
        return acc;
      },
      {} as Record<string, string>,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTask = useCallback(
    async (title: string, list: "today" | "later") => {
      // Get the highest order value for tasks in this list
      const existingTasks = await db.tasks.where("list").equals(list).toArray();
      const maxOrder = existingTasks.reduce(
        (max, t) => Math.max(max, t.order || 0),
        -1,
      );

      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        completed: false,
        list,
        createdAt: new Date().toISOString(),
        date: list === "today" ? selectedDate : undefined,
        color: "#3b82f6",
        order: maxOrder + 1,
      };
      await db.tasks.add(newTask);
    },
    [selectedDate],
  );

  const toggleTask = useCallback(async (id: string) => {
    const task = await db.tasks.get(id);
    if (task) {
      await db.tasks.update(id, { completed: !task.completed });
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await db.transaction("rw", db.tasks, db.timeBlocks, async () => {
      await db.tasks.delete(id);
      await db.timeBlocks.where("taskId").equals(id).delete();
    });
  }, []);

  const duplicateTask = useCallback(async (id: string) => {
    const task = await db.tasks.get(id);
    if (!task) return;

    // Get the highest order value for tasks in this list
    const existingTasks = await db.tasks
      .where("list")
      .equals(task.list)
      .toArray();
    const maxOrder = existingTasks.reduce(
      (max, t) => Math.max(max, t.order || 0),
      -1,
    );

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: `${task.title} (copy)`,
      completed: false,
      list: task.list,
      createdAt: new Date().toISOString(),
      date: task.date,
      order: maxOrder + 1,
      color: task.color,
    };
    await db.tasks.add(newTask);
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    await db.transaction("rw", db.tasks, db.timeBlocks, async () => {
      await db.tasks.update(id, updates);
      if (updates.color) {
        await db.timeBlocks
          .where("taskId")
          .equals(id)
          .modify({ color: updates.color });
      }
    });
  }, []);

  const updateTaskTitle = useCallback(async (id: string, title: string) => {
    await db.tasks.update(id, { title });
  }, []);

  const moveTaskToList = useCallback(
    async (id: string, list: "today" | "later") => {
      const date = list === "today" ? selectedDate : undefined;
      await db.transaction("rw", db.tasks, db.timeBlocks, async () => {
        await db.tasks.update(id, { list, date });
        if (list === "later") {
          await db.timeBlocks.where("taskId").equals(id).delete();
        }
      });
    },
    [selectedDate],
  );

  const reorderTasks = useCallback(async (activeId: string, overId: string) => {
    await db.transaction("rw", db.tasks, async () => {
      const activeTask = await db.tasks.get(activeId);
      const overTask = await db.tasks.get(overId);

      if (!activeTask || !overTask) return;
      if (activeTask.list !== overTask.list) return; // Only reorder within same list

      const tasksInList = await db.tasks
        .where("list")
        .equals(activeTask.list)
        .sortBy("order");

      const activeIndex = tasksInList.findIndex((t) => t.id === activeId);
      const overIndex = tasksInList.findIndex((t) => t.id === overId);

      if (activeIndex === -1 || overIndex === -1) return;

      // Reorder: remove from current position and insert at new position
      const [removed] = tasksInList.splice(activeIndex, 1);
      tasksInList.splice(overIndex, 0, removed);

      // Update all orders
      await Promise.all(
        tasksInList.map((task, index) =>
          db.tasks.update(task.id, { order: index }),
        ),
      );
    });
  }, []);

  const scheduleTask = useCallback(
    async (taskId: string, startTime: string, durationMinutes?: number) => {
      const dur = durationMinutes ?? (await db.appSettings.get('default'))?.defaultTaskDuration ?? 20;
      const start = new Date(startTime);
      const end = new Date(start.getTime() + dur * 60000);
      const dateStr = format(start, "yyyy-MM-dd");

      await db.transaction("rw", db.tasks, db.timeBlocks, async () => {
        const task = await db.tasks.get(taskId);
        if (!task) return;

        await db.tasks.update(taskId, { list: "today", date: dateStr });

        const newBlock: TimeBlock = {
          id: Math.random().toString(36).substr(2, 9),
          taskId: taskId,
          title: task.title,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          color: task.color || "#3b82f6",
        };

        await db.timeBlocks.where("taskId").equals(taskId).delete();
        await db.timeBlocks.add(newBlock);
      });
    },
    [],
  );

  const unscheduleTask = useCallback(async (taskId: string) => {
    await db.timeBlocks.where("taskId").equals(taskId).delete();
  }, []);

  const setDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const updateNote = useCallback(async (date: string, content: string) => {
    await db.notes.put({ date, content });
  }, []);

  const updateTimeBlock = useCallback(
    async (id: string, updates: Partial<TimeBlock>) => {
      await db.timeBlocks.update(id, updates);
    },
    [],
  );

  const deleteTimeBlock = useCallback(async (id: string) => {
    await db.timeBlocks.delete(id);
  }, []);

  // Goal CRUD
  const goals = useLiveQuery(() => db.weeklyGoals.toArray(), []) || [];

  const addGoal = useCallback(async (goal: Omit<WeeklyGoal, "id">) => {
    await db.weeklyGoals.add({
      id: Math.random().toString(36).substr(2, 9),
      ...goal,
    });
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<WeeklyGoal>) => {
    await db.weeklyGoals.update(id, updates);
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    await db.weeklyGoals.delete(id);
  }, []);

  return {
    tasks,
    timeBlocks,
    notes,
    selectedDate,
    addTask,
    toggleTask,
    deleteTask,
    duplicateTask,
    updateTask,
    updateTaskTitle,
    moveTaskToList,
    setDate,
    updateNote,
    updateTimeBlock,
    deleteTimeBlock,
    scheduleTask,
    unscheduleTask,
    reorderTasks,
    // Goals
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
  };
}
