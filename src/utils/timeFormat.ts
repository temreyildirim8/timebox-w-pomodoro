import { format, parseISO } from 'date-fns';

let cachedTimeFormat: '12h' | '24h' = '24h';

export function setTimeFormat(fmt: '12h' | '24h') {
  cachedTimeFormat = fmt;
}

export function getTimeFormat() {
  return cachedTimeFormat;
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return cachedTimeFormat === '24h' ? format(d, 'HH:mm') : format(d, 'h:mm a');
}
