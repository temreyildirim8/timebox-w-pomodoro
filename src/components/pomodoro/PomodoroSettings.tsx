import { useState } from 'react';
import { X, Bell, Volume2, VolumeX } from 'lucide-react';
import { db } from '../../db/db';
import { requestPermission, hasPermission } from '../../utils/notifications';
import { playBeep } from '../../utils/audio';
import type { PomodoroConfig } from '../../hooks/usePomodoro';

interface PomodoroSettingsPanelProps {
  config: PomodoroConfig;
  onUpdate: (config: PomodoroConfig) => void;
}

export function PomodoroSettingsPanel({ config, onUpdate }: PomodoroSettingsPanelProps) {
  const [workMin, setWorkMin] = useState(Math.floor(config.workDuration / 60));
  const [shortBreakMin, setShortBreakMin] = useState(Math.floor(config.shortBreakDuration / 60));
  const [longBreakMin, setLongBreakMin] = useState(Math.floor(config.longBreakDuration / 60));
  const [sessions, setSessions] = useState(config.sessionsBeforeLongBreak);
  const [sound, setSound] = useState(config.soundEnabled);
  const [notifications, setNotifications] = useState(config.notificationsEnabled);
  const [autoStartBreaks, setAutoStartBreaks] = useState(config.autoStartBreaks);
  const [autoStartWork, setAutoStartWork] = useState(config.autoStartWork);

  const handleSave = async () => {
    const newConfig: PomodoroConfig = {
      workDuration: workMin * 60,
      shortBreakDuration: shortBreakMin * 60,
      longBreakDuration: longBreakMin * 60,
      sessionsBeforeLongBreak: sessions,
      soundEnabled: sound,
      notificationsEnabled: notifications,
      autoStartBreaks,
      autoStartWork,
    };

    await db.pomodoroSettings.put({ id: 'default', ...newConfig });
    onUpdate(newConfig);

    if (sound) playBeep();
  };

  // Auto-save on any change
  const saveAndUpdate = () => {
    setTimeout(() => handleSave(), 0);
  };

  const toggleNotifications = async () => {
    if (!notifications) {
      const perm = await requestPermission();
      setNotifications(perm === 'granted');
    } else {
      setNotifications(false);
    }
    saveAndUpdate();
  };

  return (
    <div className="settings-body">
      <div className="setting-group">
        <label className="setting-label">
          <span>Work Duration</span>
          <span className="setting-value">{workMin} min</span>
        </label>
        <input
          type="range"
          min={1}
          max={60}
          value={workMin}
          onChange={(e) => setWorkMin(Number(e.target.value))}
          onMouseUp={saveAndUpdate}
          onTouchEnd={saveAndUpdate}
          className="setting-slider"
        />
      </div>
      <div className="setting-group">
        <label className="setting-label">
          <span>Short Break</span>
          <span className="setting-value">{shortBreakMin} min</span>
        </label>
        <input
          type="range"
          min={1}
          max={30}
          value={shortBreakMin}
          onChange={(e) => setShortBreakMin(Number(e.target.value))}
          onMouseUp={saveAndUpdate}
          onTouchEnd={saveAndUpdate}
          className="setting-slider"
        />
      </div>
      <div className="setting-group">
        <label className="setting-label">
          <span>Long Break</span>
          <span className="setting-value">{longBreakMin} min</span>
        </label>
        <input
          type="range"
          min={1}
          max={30}
          value={longBreakMin}
          onChange={(e) => setLongBreakMin(Number(e.target.value))}
          onMouseUp={saveAndUpdate}
          onTouchEnd={saveAndUpdate}
          className="setting-slider"
        />
      </div>
      <div className="setting-group">
        <label className="setting-label">
          <span>Sessions before long break</span>
          <span className="setting-value">{sessions}</span>
        </label>
        <input
          type="range"
          min={2}
          max={8}
          value={sessions}
          onChange={(e) => setSessions(Number(e.target.value))}
          onMouseUp={saveAndUpdate}
          onTouchEnd={saveAndUpdate}
          className="setting-slider"
        />
      </div>
      <div className="setting-group toggle-group">
        <label className="setting-label">
          <span>Sound</span>
          <button className="toggle-btn" onClick={() => { setSound(!sound); saveAndUpdate(); }}>
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </label>
      </div>
      <div className="setting-group toggle-group">
        <label className="setting-label">
          <span>Notifications</span>
          <button className="toggle-btn" onClick={toggleNotifications}>
            {notifications && hasPermission() ? <Bell size={16} /> : <Bell size={16} className="muted" />}
          </button>
        </label>
      </div>
      <div className="setting-group toggle-group">
        <label className="setting-label">
          <span>Auto-start breaks</span>
          <button className={`toggle-btn ${autoStartBreaks ? 'active' : ''}`} onClick={() => { setAutoStartBreaks(!autoStartBreaks); saveAndUpdate(); }}>
            {autoStartBreaks ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </label>
      </div>
      <div className="setting-group toggle-group">
        <label className="setting-label">
          <span>Auto-start work</span>
          <button className={`toggle-btn ${autoStartWork ? 'active' : ''}`} onClick={() => { setAutoStartWork(!autoStartWork); saveAndUpdate(); }}>
            {autoStartWork ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </label>
      </div>
    </div>
  );
}

interface PomodoroSettingsModalProps {
  onClose: () => void;
  config: PomodoroConfig;
  onUpdate: (config: PomodoroConfig) => void;
}

export function PomodoroSettingsModal({ onClose, config, onUpdate }: PomodoroSettingsModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Pomodoro Settings</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <PomodoroSettingsPanel config={config} onUpdate={onUpdate} />
        <div className="settings-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
