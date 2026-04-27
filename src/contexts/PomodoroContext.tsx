import { createContext, useContext } from 'react';
import { usePomodoro } from '../hooks/usePomodoro';

type PomodoroReturn = ReturnType<typeof usePomodoro>;
const PomodoroContext = createContext<PomodoroReturn | null>(null);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const pomodoro = usePomodoro();
  return <PomodoroContext.Provider value={pomodoro}>{children}</PomodoroContext.Provider>;
}

export function usePomodoroContext() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoroContext must be inside PomodoroProvider');
  return ctx;
}
