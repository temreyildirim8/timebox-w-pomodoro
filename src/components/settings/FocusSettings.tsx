import { useAppSettings } from '../../hooks/useAppSettings';

export function FocusSettings() {
  const { settings, updateSettings } = useAppSettings();

  return (
    <div className="settings-body">
      <div className="settings-section">
        <div className="settings-label-row">
          <div className="settings-label">Auto-enable focus mode when pomodoro starts</div>
          <button
            className={`settings-toggle ${settings.focusAutoEnable ? 'active' : ''}`}
            onClick={() => updateSettings({ focusAutoEnable: !settings.focusAutoEnable })}
            aria-label="Toggle auto-enable focus mode"
          >
            <span className="settings-toggle-thumb" />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-label">Dim level</div>
        <div className="settings-control">
          <div className="setting-label">
            <span className="setting-value">{settings.focusDimLevel}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            value={settings.focusDimLevel}
            onChange={(e) => updateSettings({ focusDimLevel: Number(e.target.value) })}
            className="setting-slider"
          />
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-label-row">
          <div className="settings-label">Warn on tab switch</div>
          <button
            className={`settings-toggle ${settings.focusWarnOnSwitch ? 'active' : ''}`}
            onClick={() => updateSettings({ focusWarnOnSwitch: !settings.focusWarnOnSwitch })}
            aria-label="Toggle warn on tab switch"
          >
            <span className="settings-toggle-thumb" />
          </button>
        </div>
      </div>
    </div>
  );
}
