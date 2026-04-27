import Dexie, { type Table } from 'dexie';
import type { Task, TimeBlock, PomodoroSession, WeeklyGoal, PomodoroSettings, AppSettings } from '../types';

export interface DailyNote {
  date: string;
  content: string;
}

export class TimeboxDatabase extends Dexie {
  tasks!: Table<Task>;
  timeBlocks!: Table<TimeBlock>;
  notes!: Table<DailyNote>;
  pomodoroSessions!: Table<PomodoroSession>;
  weeklyGoals!: Table<WeeklyGoal>;
  pomodoroSettings!: Table<PomodoroSettings>;
  appSettings!: Table<AppSettings>;

  constructor() {
    super('TimeboxDatabase');
    this.version(1).stores({
      tasks: 'id, title, completed, list, date, createdAt',
      timeBlocks: 'id, taskId, title, startTime, endTime',
      notes: 'date'
    });
    this.version(2).stores({
      tasks: 'id, title, completed, list, date, createdAt, order',
      timeBlocks: 'id, taskId, title, startTime, endTime',
      notes: 'date'
    }).upgrade(tx => {
      // Migrate existing tasks to add order field
      return tx.table('tasks').toCollection().modify(task => {
        if (task.order === undefined) {
          task.order = 0;
        }
      });
    });
    this.version(3).stores({
      tasks: 'id, title, completed, list, date, createdAt, order',
      timeBlocks: 'id, taskId, title, startTime, endTime',
      notes: 'date',
      pomodoroSessions: 'id, taskId, date, startedAt, duration',
      weeklyGoals: 'id, weekStart, completed',
      pomodoroSettings: 'id'
    });
    this.version(4).stores({
      tasks: 'id, title, completed, list, date, createdAt, order',
      timeBlocks: 'id, taskId, title, startTime, endTime',
      notes: 'date',
      pomodoroSessions: 'id, taskId, date, startedAt, duration',
      weeklyGoals: 'id, weekStart, completed',
      pomodoroSettings: 'id',
      appSettings: 'id'
    });
  }
}

export const db = new TimeboxDatabase();
