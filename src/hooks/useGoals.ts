import { useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getCurrentWeekStart } from '../utils/goals';
import type { WeeklyGoal } from '../types';

const DEFAULT_GOALS: Omit<WeeklyGoal, 'id' | 'weekStart' | 'completed'>[] = [
  { title: 'Complete 10 tasks', target: 10, current: 0, type: 'tasks' },
  { title: '4 hours of focus', target: 4, current: 0, type: 'hours' },
  { title: '8 pomodoro sessions', target: 8, current: 0, type: 'pomodoros' },
];

const GOALS_INIT_KEY = 'timebox_goals_initialized_';

export function useGoals() {
  const weekStart = getCurrentWeekStart();

  // Read-only liveQuery (handle migration-in-progress gracefully)
  const allGoals = useLiveQuery(async () => {
    try {
      return await db.weeklyGoals.toArray();
    } catch {
      return [];
    }
  }, []) || [];
  const currentWeekGoals = allGoals.filter((g) => g.weekStart === weekStart);

  // Side effect: create default goals for new weeks
  useEffect(() => {
    // Guard against Strict Mode double-invocation
    const initKey = GOALS_INIT_KEY + weekStart;
    if (sessionStorage.getItem(initKey)) return;
    sessionStorage.setItem(initKey, '1');

    db.weeklyGoals.where('weekStart').equals(weekStart).count().then((count) => {
      if (count === 0) {
        for (const g of DEFAULT_GOALS) {
          db.weeklyGoals.add({
            id: Math.random().toString(36).substr(2, 9),
            weekStart,
            ...g,
            completed: false,
          }).catch(() => {});
        }
      }
    }).catch(() => {});
  }, [weekStart]);

  const addGoal = useCallback(
    async (goal: Omit<WeeklyGoal, 'id' | 'weekStart' | 'completed'>) => {
      await db.weeklyGoals.add({
        id: Math.random().toString(36).substr(2, 9),
        weekStart,
        ...goal,
        completed: false,
      });
    },
    [weekStart],
  );

  const updateGoal = useCallback(async (id: string, updates: Partial<WeeklyGoal>) => {
    await db.weeklyGoals.update(id, updates);
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    await db.weeklyGoals.delete(id);
  }, []);

  const incrementProgress = useCallback(async (id: string, amount: number = 1) => {
    const goal = await db.weeklyGoals.get(id);
    if (!goal) return;
    const newCurrent = Math.min(goal.current + amount, goal.target);
    await db.weeklyGoals.update(id, {
      current: newCurrent,
      completed: newCurrent >= goal.target,
    });
  }, []);

  return {
    goals: currentWeekGoals,
    weekStart,
    addGoal,
    updateGoal,
    deleteGoal,
    incrementProgress,
  };
}
