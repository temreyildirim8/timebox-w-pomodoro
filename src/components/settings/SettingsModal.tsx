import { useState } from 'react';
import { X, Settings, Timer, Eye, Database } from 'lucide-react';
import { GeneralSettings } from './GeneralSettings';
import { PomodoroSettingsTab } from './PomodoroSettingsTab';
import { FocusSettings } from './FocusSettings';
import { DataSettings } from './DataSettings';

type SettingsTab = 'general' | 'pomodoro' | 'focus' | 'data';

interface SettingsModalProps {
  onClose: () => void;
  initialTab?: SettingsTab;
}

const TABS: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
  { id: 'focus', label: 'Focus', icon: Eye },
  { id: 'data', label: 'Data', icon: Database },
];

export function SettingsModal({ onClose, initialTab = 'general' }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Settings</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="settings-tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="settings-panel">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'pomodoro' && <PomodoroSettingsTab />}
          {activeTab === 'focus' && <FocusSettings />}
          {activeTab === 'data' && <DataSettings />}
        </div>
      </div>
    </div>
  );
}
