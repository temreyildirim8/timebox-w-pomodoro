import { useMemo } from 'react';
import { Clock, CheckCircle2, Circle, CalendarClock, Timer } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { format, parseISO } from 'date-fns';
import { formatTime } from '../../utils/timeFormat';

interface TodayOverviewProps {
  selectedDate: string;
}

export function TodayOverview({ selectedDate }: TodayOverviewProps) {
  const { tasks, timeBlocks } = useStore();

  const stats = useMemo(() => {
    const dayStr = selectedDate;

    const dayBlocks = timeBlocks.filter((b) => {
      const blockDate = parseISO(b.startTime);
      return format(blockDate, 'yyyy-MM-dd') === dayStr;
    });

    const dayTasks = tasks.filter((t) => t.date === dayStr || (t.list === 'today' && !t.date));
    const completedTasks = dayTasks.filter((t) => t.completed);
    const remainingTasks = dayTasks.filter((t) => !t.completed);

    const totalBlockMinutes = dayBlocks.reduce((sum, b) => {
      const start = parseISO(b.startTime);
      const end = parseISO(b.endTime);
      return sum + (end.getTime() - start.getTime()) / 60000;
    }, 0);

    const totalBlockHours = Math.round((totalBlockMinutes / 60) * 10) / 10;
    const freeHours = Math.round((24 - totalBlockMinutes / 60) * 10) / 10;

    const now = new Date();
    const upcomingBlock = dayBlocks
      .filter((b) => parseISO(b.endTime) > now)
      .sort((a, b) => parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime())[0];

    return {
      totalBlockHours,
      freeHours,
      totalTasks: dayTasks.length,
      completedTasks: completedTasks.length,
      remainingTasks: remainingTasks.length,
      upcomingBlock,
      blockCount: dayBlocks.length,
    };
  }, [tasks, timeBlocks, selectedDate]);

  return (
    <div className="today-overview">
      <div className="overview-header">
        <Clock size={14} />
        <span>Today's Overview</span>
      </div>
      <div className="overview-stats">
        <div className="overview-stat">
          <Timer size={14} className="stat-icon" />
          <div className="stat-value">{stats.totalBlockHours}h</div>
          <div className="stat-label">Blocked</div>
        </div>
        <div className="overview-stat">
          <Circle size={14} className="stat-icon" />
          <div className="stat-value">{stats.freeHours}h</div>
          <div className="stat-label">Free</div>
        </div>
        <div className="overview-stat">
          <CheckCircle2 size={14} className="stat-icon" />
          <div className="stat-value">{stats.completedTasks}/{stats.totalTasks}</div>
          <div className="stat-label">Done</div>
        </div>
        <div className="overview-stat">
          <CalendarClock size={14} className="stat-icon" />
          <div className="stat-value">{stats.blockCount}</div>
          <div className="stat-label">Blocks</div>
        </div>
      </div>
      {stats.upcomingBlock && (
        <div className="overview-next">
          <span className="next-label">Next:</span>
          <span className="next-title">{stats.upcomingBlock.title || 'Untitled'}</span>
          <span className="next-time">
            {formatTime(stats.upcomingBlock.startTime)}
          </span>
        </div>
      )}
    </div>
  );
}
