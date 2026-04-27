import { usePomodoroContext } from '../../contexts/PomodoroContext';
import { PomodoroSettingsPanel } from '../pomodoro/PomodoroSettings';

export function PomodoroSettingsTab() {
  const pomodoro = usePomodoroContext();

  return (
    <PomodoroSettingsPanel config={pomodoro.config} onUpdate={pomodoro.setConfig} />
  );
}
