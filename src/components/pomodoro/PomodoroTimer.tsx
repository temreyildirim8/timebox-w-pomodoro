import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { usePomodoroContext } from '../../contexts/PomodoroContext';
import { db } from '../../db/db';

export function PomodoroTimer() {
  const { status, timeLeft, sessionType, currentSession, attachedBlockTitle, config, toggle, stop, reset } = usePomodoroContext();

  // Step 2: Fix hardcoded totalSeconds -- use config instead
  let totalSeconds: number;
  if (sessionType === 'work') totalSeconds = config.workDuration;
  else if (sessionType === 'shortBreak') totalSeconds = config.shortBreakDuration;
  else totalSeconds = config.longBreakDuration;

  const progress = 1 - timeLeft / totalSeconds;

  // Step 6: SVG progress ring
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const color = sessionType === 'work' ? '#3b82f6' : sessionType === 'shortBreak' ? '#10b981' : '#8b5cf6';

  // Step 7: Session history dots
  const todaySessions = useLiveQuery(async () => {
    const today = new Date().toISOString().split('T')[0];
    return db.pomodoroSessions.where('date').equals(today).count();
  }, []) || 0;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const statusLabel =
    status === 'idle'
      ? 'Ready'
      : status === 'running'
        ? sessionType === 'work'
          ? 'Focusing'
          : 'On Break'
        : status === 'paused'
          ? 'Paused'
          : 'Break';

  return (
    <div className="pomodoro-timer">
      <div className="pomodoro-status">
        <span className={`status-dot ${status === 'running' ? 'active' : ''}`} />
        {statusLabel}
      </div>
      {currentSession > 0 && <div className="pomodoro-count">#{currentSession}</div>}
      <div className="pomodoro-display">
        <svg width="120" height="120" className="pomodoro-svg">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            className={`pomodoro-ring ${status === 'running' ? 'running' : ''}`}
            transform="rotate(-90 60 60)" />
        </svg>
        <div className="pomodoro-time">{display}</div>
      </div>
      {attachedBlockTitle && (
        <div className="pomodoro-attached">
          <span className="attached-label">For:</span> {attachedBlockTitle}
        </div>
      )}
      <div className="pomodoro-controls">
        <button className="pomo-btn" onClick={toggle} aria-label={status === 'running' ? 'Pause' : 'Start'}>
          {status === 'running' ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="pomo-btn" onClick={stop} aria-label="Stop" disabled={status === 'idle'}>
          <Square size={14} />
        </button>
        <button className="pomo-btn" onClick={reset} aria-label="Reset">
          <RotateCcw size={14} />
        </button>
      </div>
      {todaySessions > 0 && (
        <div className="pomodoro-sessions">
          {Array.from({ length: todaySessions }, (_, i) => (
            <span key={i} className="session-dot filled" />
          ))}
        </div>
      )}
    </div>
  );
}
