import { useState, useEffect } from "react";
import { Sidebar } from "./components/sidebar/Sidebar";
import { Schedule } from "./components/schedule/Schedule";
import { Notes } from "./components/notes/Notes";
import { ActivityHeatmap } from "./components/heatmap/ActivityHeatmap";
import { ToastContainer } from "./components/ui/Toast";
import { PomodoroTimer } from "./components/pomodoro/PomodoroTimer";
import { ShortcutsHelpModal } from "./components/shortcuts/ShortcutsHelpModal";
import { SettingsModal } from "./components/settings/SettingsModal";
import { TodayOverview } from "./components/overview/TodayOverview";
import { FocusMode } from "./components/focus/FocusMode";
import { WeeklyReview } from "./components/review/WeeklyReview";
import { WeeklyGoals } from "./components/goals/WeeklyGoals";
import { useStore } from "./hooks/useStore";
import { useAppSettings } from "./hooks/useAppSettings";
import { PomodoroProvider, usePomodoroContext } from "./contexts/PomodoroContext";
import { useKeyboardShortcuts, shortcutRegistry } from "./hooks/useKeyboardShortcuts";
import { setWeekStartsOn } from "./utils/goals";
import { setTimeFormat } from "./utils/timeFormat";

function AppInner() {
  const store = useStore();
  const {
    tasks,
    timeBlocks,
    notes,
    selectedDate,
    addTask,
    toggleTask,
    deleteTask,
    duplicateTask,
    updateTask,
    updateTaskTitle,
    moveTaskToList,
    setDate,
    updateNote,
    updateTimeBlock,
    deleteTimeBlock,
    scheduleTask,
    unscheduleTask,
    reorderTasks,
  } = store;

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'pomodoro' | 'focus' | 'data'>('general');
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);

  const pomodoro = usePomodoroContext();
  const { settings } = useAppSettings();

  // Sync weekStartsOn setting to goals utility
  useEffect(() => {
    setWeekStartsOn(settings.weekStartsOn);
  }, [settings.weekStartsOn]);

  // Sync time format
  useEffect(() => {
    setTimeFormat(settings.timeFormat);
  }, [settings.timeFormat]);

  const currentNote = notes[selectedDate] || "";

  const openSettings = (tab?: 'general' | 'pomodoro' | 'focus' | 'data') => {
    setSettingsTab(tab ?? 'general');
    setShowSettings(true);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts("?", () => setShowShortcuts(true), "Show keyboard shortcuts");
  useKeyboardShortcuts("F", () => {
    const win = window as typeof window & { __toggleFocusMode?: () => void };
    if (win.__toggleFocusMode) win.__toggleFocusMode();
  }, "Toggle focus mode");
  useKeyboardShortcuts("P", () => openSettings('pomodoro'), "Pomodoro settings");
  useKeyboardShortcuts(",", () => openSettings('general'), "Open settings");
  useKeyboardShortcuts("W", () => setShowWeeklyReview(true), "Weekly review");
  useKeyboardShortcuts("N", () => {
    const input = document.querySelector<HTMLInputElement>(".task-input");
    if (input) input.focus();
  }, "New task");
  useKeyboardShortcuts("Space", () => pomodoro.toggle(), "Start/pause pomodoro");
  useKeyboardShortcuts("Escape", () => {
    setShowShortcuts(false);
    setShowSettings(false);
    setShowWeeklyReview(false);
  }, "Close modals");

  // Global keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      shortcutRegistry.handleKeyDown(e);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <FocusMode>
      <div className="app-container">
        <ToastContainer />
        <div className="app-sidebar-column">
          <Sidebar
            tasks={tasks}
            timeBlocks={timeBlocks}
            addTask={addTask}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            duplicateTask={duplicateTask}
            updateTask={updateTask}
            updateTaskTitle={updateTaskTitle}
            moveTaskToList={moveTaskToList}
            reorderTasks={reorderTasks}
            selectedDate={selectedDate}
            onOpenSettings={() => openSettings('general')}
          />
          <WeeklyGoals />
        </div>

        <Schedule
          selectedDate={selectedDate}
          timeBlocks={timeBlocks}
          tasks={tasks}
          deleteTimeBlock={deleteTimeBlock}
          updateTimeBlock={updateTimeBlock}
          setDate={setDate}
          scheduleTask={scheduleTask}
          unscheduleTask={unscheduleTask}
        />

        <div className="app-notes-column">
          <TodayOverview selectedDate={selectedDate} />
          <PomodoroTimer />
          <Notes
            date={selectedDate}
            note={currentNote}
            updateNote={updateNote}
          />
          <ActivityHeatmap tasks={tasks} />
        </div>
      </div>

      {/* Modals */}
      {showShortcuts && <ShortcutsHelpModal onClose={() => setShowShortcuts(false)} />}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          initialTab={settingsTab}
        />
      )}
      {showWeeklyReview && <WeeklyReview onClose={() => setShowWeeklyReview(false)} />}
    </FocusMode>
  );
}

function App() {
  return (
    <PomodoroProvider>
      <AppInner />
    </PomodoroProvider>
  );
}

export default App;
