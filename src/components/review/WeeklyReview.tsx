import { useMemo, useState } from 'react';
import { X, CheckCircle2, ArrowRight, Clock, TrendingUp, CalendarDays } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { getWeekStartsOn } from '../../utils/goals';

interface WeeklyReviewProps {
  onClose: () => void;
}

export function WeeklyReview({ onClose }: WeeklyReviewProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'tasks' | 'sessions'>('summary');

  // Get last week's date range (Monday to Sunday)
  const weekRange = useMemo(() => {
    const today = new Date();
    const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: getWeekStartsOn() });
    const lastWeekEnd = endOfWeek(subDays(today, 7), { weekStartsOn: getWeekStartsOn() });
    return {
      start: format(lastWeekStart, 'yyyy-MM-dd'),
      end: format(lastWeekEnd, 'yyyy-MM-dd'),
      label: `${format(lastWeekStart, 'MMM d')} - ${format(lastWeekEnd, 'MMM d')}`,
    };
  }, []);

  const allTasks = useLiveQuery(() => db.tasks.toArray(), []) || [];
  const allSessions = useLiveQuery(() => db.pomodoroSessions.toArray(), []) || [];

  const stats = useMemo(() => {
    const tasksInRange = allTasks.filter((t) => {
      if (!t.date) return false;
      return t.date >= weekRange.start && t.date <= weekRange.end;
    });

    const completedTasks = tasksInRange.filter((t) => t.completed);
    const carryOvers = tasksInRange.filter((t) => !t.completed);

    const sessionsInRange = allSessions.filter((s) => {
      return s.date >= weekRange.start && s.date <= weekRange.end;
    });

    const totalFocusMinutes = sessionsInRange.reduce((sum, s) => {
      return sum + Math.floor(s.duration / 60);
    }, 0);

    const totalFocusHours = Math.round((totalFocusMinutes / 60) * 10) / 10;

    // Calculate streak (consecutive days with at least one completed task)
    let streak = 0;
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      const dayCompleted = tasksInRange.filter(
        (t) => t.date === checkDate && t.completed
      );
      if (dayCompleted.length > 0) {
        streak++;
      } else {
        break;
      }
    }

    return {
      totalTasks: tasksInRange.length,
      completedTasks: completedTasks.length,
      carryOvers: carryOvers.length,
      totalFocusHours,
      sessionCount: sessionsInRange.length,
      streak,
      completedList: completedTasks,
      carryOverList: carryOvers,
      sessionsList: sessionsInRange,
    };
  }, [allTasks, allSessions, weekRange]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content weekly-review" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Weekly Review</h3>
            <span className="review-period">{weekRange.label}</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="review-tabs">
          <button
            className={`review-tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`review-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button
            className={`review-tab ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
        </div>
        {activeTab === 'summary' && (
          <div className="review-summary">
            <div className="review-stats-grid">
              <div className="review-stat-card">
                <CheckCircle2 size={20} className="stat-icon success" />
                <div className="stat-number">{stats.completedTasks}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="review-stat-card">
                <ArrowRight size={20} className="stat-icon warning" />
                <div className="stat-number">{stats.carryOvers}</div>
                <div className="stat-label">Carry-overs</div>
              </div>
              <div className="review-stat-card">
                <Clock size={20} className="stat-icon info" />
                <div className="stat-number">{stats.totalFocusHours}h</div>
                <div className="stat-label">Focus Time</div>
              </div>
              <div className="review-stat-card">
                <TrendingUp size={20} className="stat-icon accent" />
                <div className="stat-number">{stats.streak}</div>
                <div className="stat-label">Day Streak</div>
              </div>
            </div>
            {stats.sessionCount > 0 && (
              <div className="review-pomodoro-summary">
                <CalendarDays size={14} />
                <span>{stats.sessionCount} pomodoro sessions completed</span>
              </div>
            )}
          </div>
        )}
        {activeTab === 'tasks' && (
          <div className="review-tasks">
            <h4>Completed ({stats.completedTasks})</h4>
            {stats.completedList.length === 0 && (
              <div className="empty-hint" style={{ position: 'static' }}>No completed tasks</div>
            )}
            <ul className="review-task-list">
              {stats.completedList.map((task) => (
                <li key={task.id}>
                  <span className="task-date">{task.date}</span>
                  <span className="task-title">{task.title}</span>
                </li>
              ))}
            </ul>
            <h4>Carry-overs ({stats.carryOvers})</h4>
            {stats.carryOverList.length === 0 && (
              <div className="empty-hint" style={{ position: 'static' }}>No carry-overs</div>
            )}
            <ul className="review-task-list">
              {stats.carryOverList.map((task) => (
                <li key={task.id}>
                  <span className="task-date">{task.date}</span>
                  <span className="task-title">{task.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {activeTab === 'sessions' && (
          <div className="review-sessions">
            {stats.sessionsList.length === 0 && (
              <div className="empty-hint" style={{ position: 'static' }}>No pomodoro sessions</div>
            )}
            <ul className="review-session-list">
              {stats.sessionsList.map((session) => (
                <li key={session.id}>
                  <span className="session-date">{session.date}</span>
                  <span className="session-duration">{Math.floor(session.duration / 60)}min</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
