import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { AppSettings } from '../types';

const DEFAULTS: AppSettings = {
  id: 'default',
  weekStartsOn: 1,
  timeFormat: '24h',
  defaultTaskColor: '#3b82f6',
  defaultTaskDuration: 20,
  defaultCalendarView: 'day',
  focusAutoEnable: false,
  focusDimLevel: 15,
  focusWarnOnSwitch: true,
};

const SETTINGS_INIT_KEY = 'timebox_settings_initialized';

export function useAppSettings() {
  const settings = useLiveQuery(() => db.appSettings.get('default'), []);

  // Create defaults on first load
  useEffect(() => {
    if (sessionStorage.getItem(SETTINGS_INIT_KEY)) return;
    sessionStorage.setItem(SETTINGS_INIT_KEY, '1');

    db.appSettings.get('default').then((existing) => {
      if (!existing) {
        db.appSettings.put(DEFAULTS).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const existing = await db.appSettings.get('default');
    if (existing) {
      await db.appSettings.update('default', updates);
    } else {
      await db.appSettings.put({ ...DEFAULTS, ...updates });
    }
  };

  return {
    settings: settings ?? DEFAULTS,
    updateSettings,
  };
}
