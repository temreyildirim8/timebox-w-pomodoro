import { startOfWeek, addDays, format, parseISO } from 'date-fns';

// Module-level cache, updated when app settings load
let cachedWeekStartsOn: 0 | 1 = 1;

export function setWeekStartsOn(value: 0 | 1) {
  cachedWeekStartsOn = value;
}

export function getWeekStartsOn(): 0 | 1 {
  return cachedWeekStartsOn;
}

export function getCurrentWeekStart(): string {
  const start = startOfWeek(new Date(), { weekStartsOn: cachedWeekStartsOn });
  return format(start, 'yyyy-MM-dd');
}

export function getCurrentWeekEnd(): string {
  const start = startOfWeek(new Date(), { weekStartsOn: cachedWeekStartsOn });
  const end = addDays(start, 6);
  return format(end, 'yyyy-MM-dd');
}

export function getWeekRange(weekStart: string) {
  const start = parseISO(weekStart);
  const end = addDays(start, 6);
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}

export function isNewWeek(lastWeekStart: string | undefined): boolean {
  if (!lastWeekStart) return true;
  const currentWeekStart = getCurrentWeekStart();
  return currentWeekStart > lastWeekStart;
}
