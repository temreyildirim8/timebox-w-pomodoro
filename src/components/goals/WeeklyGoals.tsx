import { useState } from 'react';
import { Target, Plus } from 'lucide-react';
import { useGoals } from '../../hooks/useGoals';
import { GoalEditor } from './GoalEditor';

export function WeeklyGoals() {
  const { goals } = useGoals();
  const [showEditor, setShowEditor] = useState(false);

  return (
    <>
      <div className="weekly-goals">
        <div className="goals-header">
          <Target size={14} />
          <span>Weekly Goals</span>
          <button className="goals-add-btn" onClick={() => setShowEditor(true)}>
            <Plus size={14} />
          </button>
        </div>
        <div className="goals-list">
          {goals.map((goal) => {
            const progress = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
            return (
              <div
                key={goal.id}
                className={`goal-item ${goal.completed ? 'completed' : ''}`}
              >
                <div className="goal-info">
                  <span className="goal-title">{goal.title}</span>
                  <span className="goal-progress">
                    {goal.current}/{goal.target} {progress}%
                  </span>
                </div>
                <div className="goal-bar-container">
                  <div
                    className="goal-bar-fill"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
          {goals.length === 0 && (
            <div className="empty-hint" style={{ position: 'static' }}>
              No goals for this week. Add one to get started.
            </div>
          )}
        </div>
      </div>
      {showEditor && <GoalEditor onClose={() => setShowEditor(false)} />}
    </>
  );
}
