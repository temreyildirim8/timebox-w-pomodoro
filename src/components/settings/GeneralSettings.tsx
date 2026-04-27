import { useAppSettings } from "../../hooks/useAppSettings";

const COLOR_PRESETS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export function GeneralSettings() {
  const { settings, updateSettings } = useAppSettings();

  return (
    <div className="settings-body">
      <div className="settings-section">
        <div className="settings-label">Week starts on</div>
        <div className="settings-control">
          <div className="btn-group">
            <button
              className={`btn-option ${settings.weekStartsOn === 1 ? "active" : ""}`}
              onClick={() => updateSettings({ weekStartsOn: 1 })}
            >
              Monday
            </button>
            <button
              className={`btn-option ${settings.weekStartsOn === 0 ? "active" : ""}`}
              onClick={() => updateSettings({ weekStartsOn: 0 })}
            >
              Sunday
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-label">Time format</div>
        <div className="settings-control">
          <div className="btn-group">
            <button
              className={`btn-option ${settings.timeFormat === "24h" ? "active" : ""}`}
              onClick={() => updateSettings({ timeFormat: "24h" })}
            >
              24h
            </button>
            <button
              className={`btn-option ${settings.timeFormat === "12h" ? "active" : ""}`}
              onClick={() => updateSettings({ timeFormat: "12h" })}
            >
              12h
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-label">Default task color</div>
        <div className="settings-control">
          <div className="color-swatches">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                className={`color-swatch ${settings.defaultTaskColor === color ? "selected" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => updateSettings({ defaultTaskColor: color })}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-label">
          <span>Default task duration </span>

          <span className="setting-value">
            {settings.defaultTaskDuration} min
          </span>
        </div>
        <div className="settings-control">
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={settings.defaultTaskDuration}
            onChange={(e) =>
              updateSettings({ defaultTaskDuration: Number(e.target.value) })
            }
            className="setting-slider"
          />
        </div>
      </div>
    </div>
  );
}
