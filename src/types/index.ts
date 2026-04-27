export interface Task {
  id: string;
  title: string;
  completed: boolean;
  list: 'today' | 'later';
  createdAt: string;
  date?: string; // YYYY-MM-DD for tasks assigned to a specific day
  color?: string;
  order: number; // for manual sorting
}

export interface TimeBlock {
  id: string;
  taskId: string | null;
  title?: string;
  startTime: string; // ISO string for the specific day/time
  endTime: string;
  color?: string;
}

export interface PomodoroSession {
  id: string;
  taskId: string | null;
  date: string; // YYYY-MM-DD
  startedAt: string; // ISO string
  duration: number; // in seconds
  type: 'work' | 'shortBreak' | 'longBreak';
}

export interface WeeklyGoal {
  id: string;
  weekStart: string; // YYYY-MM-DD of Monday
  title: string;
  target: number; // e.g., number of tasks, hours, etc.
  current: number;
  type: 'tasks' | 'hours' | 'pomodoros';
  completed: boolean;
}

export interface PomodoroSettings {
  id: string; // always 'default'
  workDuration: number; // in seconds (default 1200 = 20 min)
  shortBreakDuration: number; // in seconds (default 300 = 5 min)
  longBreakDuration: number; // in seconds (default 1200 = 20 min)
  sessionsBeforeLongBreak: number; // default 4
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

export interface GoalItem extends WeeklyGoal {
  progress: number; // 0-1
}

export interface AppSettings {
  id: string; // always "default"
  weekStartsOn: 0 | 1; // 0=Sunday, 1=Monday
  timeFormat: '12h' | '24h';
  defaultTaskColor: string;
  defaultTaskDuration: number; // minutes, default 20
  defaultCalendarView: 'day';
  focusAutoEnable: boolean;
  focusDimLevel: number; // 0-50
  focusWarnOnSwitch: boolean;
}

export interface AppState {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  notes: Record<string, string>; // date -> content
  selectedDate: string; // YYYY-MM-DD
}
