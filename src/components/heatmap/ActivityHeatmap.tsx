import React, { useMemo } from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import type { Task } from "../../types";

interface ActivityHeatmapProps {
  tasks: Task[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ tasks }) => {
  const heatmapDays = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 84); // 12 weeks
    return eachDayOfInterval({ start, end });
  }, []);

  const getDayIntensity = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const completedCount = tasks.filter(
      (t) => t.date === dateStr && t.completed,
    ).length;
    if (completedCount === 0) return 0;
    if (completedCount < 2) return 1;
    if (completedCount < 4) return 2;
    return 3;
  };

  const colors = ["#1a1a1a", "#0e4429", "#006d32", "#39d353"];

  return (
    <div className="activity-heatmap animate-in delay-5">
      <h3 className="heatmap-title">Activity</h3>
      <div className="heatmap-grid">
        {heatmapDays.map((day) => {
          const intensity = getDayIntensity(day);
          return (
            <div
              key={day.toISOString()}
              title={format(day, "MMM do")}
              className="heatmap-cell"
              style={{ backgroundColor: colors[intensity] }}
            />
          );
        })}
      </div>
    </div>
  );
};
