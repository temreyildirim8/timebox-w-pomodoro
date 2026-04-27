import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useGoals } from '../../hooks/useGoals';

interface GoalEditorProps {
  onClose: () => void;
}

export function GoalEditor({ onClose }: GoalEditorProps) {
  const { addGoal } = useGoals();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(5);
  const [type, setType] = useState<'tasks' | 'hours' | 'pomodoros'>('tasks');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim()) return;
    await addGoal({ title: title.trim(), target, current: 0, type });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content goal-editor" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Weekly Goal</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="goal-form">
          <div className="form-group">
            <label>Goal</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete 10 tasks"
              className="form-input"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Target</label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              min={1}
              max={100}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'tasks' | 'hours' | 'pomodoros')}
              className="form-select"
            >
              <option value="tasks">Tasks</option>
              <option value="hours">Hours</option>
              <option value="pomodoros">Pomodoros</option>
            </select>
          </div>
        </div>
        <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!title.trim()}>
            Add Goal
          </button>
        </div>
      </div>
    </div>
  );
}
