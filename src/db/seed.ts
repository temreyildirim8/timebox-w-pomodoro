import { db } from './db';
import { format, startOfWeek, addDays } from 'date-fns';

const uid = () => Math.random().toString(36).substr(2, 9);
const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');
const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

const colors = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];

function dayAt(dayOffset: number, hour: number, minute = 0) {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export async function seedDemoData() {
  const existing = await db.tasks.count();
  if (existing > 0) {
    console.log('DB already has tasks, skipping seed.');
    return;
  }

  const todayTasks = [
    { title: 'Morning standup', color: '#6366f1' },
    { title: 'Review PR #142 — auth refactor', color: '#3b82f6' },
    { title: 'Design sprint sync', color: '#8b5cf6' },
    { title: 'Write integration tests for payments', color: '#ef4444' },
    { title: 'Lunch break', color: '#f59e0b' },
    { title: 'Ship dashboard metrics endpoint', color: '#10b981' },
    { title: 'Update onboarding docs', color: '#ec4899' },
    { title: '1:1 with Sarah', color: '#8b5cf6' },
  ].map((t, i) => ({
    id: uid(),
    title: t.title,
    completed: i < 2,
    list: 'today' as const,
    createdAt: dayAt(0, 8 + i),
    date: todayStr,
    color: t.color,
    order: i,
  }));

  const laterTasks = [
    { title: 'Migrate to React 19 RC' },
    { title: 'Set up error boundary for routes' },
    { title: 'Benchmark cold-start latency' },
    { title: 'Research edge runtime for API routes' },
  ].map((t, i) => ({
    id: uid(),
    title: t.title,
    completed: false,
    list: 'later' as const,
    createdAt: dayAt(-1, 10 + i),
    date: undefined,
    color: colors[i % colors.length],
    order: i,
  }));

  const pastTasks = [
    { offset: -1, titles: ['Fix CI flake on staging', 'Deploy v2.3.1 hotfix', 'Code review backlog'] },
    { offset: -2, titles: ['Refactor user service', 'Database migration planning', 'Team retrospective'] },
    { offset: -3, titles: ['API rate limiting research', 'Write tech spec for search', 'Pair programming with Alex'] },
    { offset: -4, titles: ['Onboard new hire — DevOps setup', 'Update Terraform modules', 'Security audit follow-up'] },
  ].flatMap(({ offset, titles }) =>
    titles.map((title, i) => ({
      id: uid(),
      title,
      completed: true,
      list: 'today' as const,
      createdAt: dayAt(offset, 9 + i),
      date: format(addDays(today, offset), 'yyyy-MM-dd'),
      color: colors[i % colors.length],
      order: i,
    }))
  );

  const todayTimeBlocks = [
    { title: 'Morning standup', start: dayAt(0, 9, 0), end: dayAt(0, 9, 30), color: '#6366f1' },
    { title: 'Review PR #142', start: dayAt(0, 9, 30), end: dayAt(0, 10, 30), color: '#3b82f6' },
    { title: 'Design sprint sync', start: dayAt(0, 11, 0), end: dayAt(0, 12, 0), color: '#8b5cf6' },
    { title: 'Write payment tests', start: dayAt(0, 13, 0), end: dayAt(0, 14, 30), color: '#ef4444' },
    { title: 'Ship metrics endpoint', start: dayAt(0, 14, 30), end: dayAt(0, 16, 0), color: '#10b981' },
    { title: '1:1 with Sarah', start: dayAt(0, 16, 30), end: dayAt(0, 17, 0), color: '#8b5cf6' },
  ].map(b => ({
    id: uid(),
    taskId: null as string | null,
    title: b.title,
    startTime: b.start,
    endTime: b.end,
    color: b.color,
  }));

  // Link first few time blocks to matching tasks
  todayTimeBlocks[0].taskId = todayTasks[0].id;
  todayTimeBlocks[1].taskId = todayTasks[1].id;
  todayTimeBlocks[2].taskId = todayTasks[2].id;
  todayTimeBlocks[3].taskId = todayTasks[3].id;
  todayTimeBlocks[4].taskId = todayTasks[5].id;
  todayTimeBlocks[5].taskId = todayTasks[7].id;

  await db.transaction('rw', [db.tasks, db.timeBlocks, db.notes, db.weeklyGoals, db.pomodoroSettings, db.appSettings], async () => {
    await db.tasks.bulkAdd([...todayTasks, ...laterTasks, ...pastTasks]);
    await db.timeBlocks.bulkAdd(todayTimeBlocks);

    await db.notes.put({
      date: todayStr,
      content: 'Focus day — shipping the metrics endpoint and closing out the payment tests. PR review first thing.',
    });

    await db.weeklyGoals.bulkAdd([
      { id: uid(), weekStart, title: 'Complete 20 tasks', target: 20, current: 14, type: 'tasks', completed: false },
      { id: uid(), weekStart, title: '8 hours deep work', target: 8, current: 5, type: 'hours', completed: false },
    ]);

    await db.pomodoroSettings.put({
      id: 'default',
      workDuration: 1200,
      shortBreakDuration: 300,
      longBreakDuration: 1200,
      sessionsBeforeLongBreak: 4,
      soundEnabled: true,
      notificationsEnabled: true,
      autoStartBreaks: false,
      autoStartWork: false,
    });

    await db.appSettings.put({
      id: 'default',
      weekStartsOn: 1,
      timeFormat: '12h',
      defaultTaskColor: '#3b82f6',
      defaultTaskDuration: 20,
      defaultCalendarView: 'day',
      focusAutoEnable: false,
      focusDimLevel: 15,
      focusWarnOnSwitch: true,
    });
  });

  console.log('Demo data seeded!');
}
