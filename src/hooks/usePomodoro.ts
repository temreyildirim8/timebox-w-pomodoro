import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../db/db";
import type { PomodoroSession } from "../types";
import { playTick, playBeep, playComplete } from "../utils/audio";
import { show, hasPermission } from "../utils/notifications";

type PomodoroStatus = "idle" | "running" | "paused" | "break";

interface PomodoroState {
  status: PomodoroStatus;
  timeLeft: number; // seconds remaining
  currentSession: number; // count of completed work sessions
  sessionType: "work" | "shortBreak" | "longBreak";
  attachedBlockId: string | null;
  attachedBlockTitle: string | null;
  attachedTaskId: string | null;
}

export interface PomodoroConfig {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

const DEFAULT_CONFIG: PomodoroConfig = {
  workDuration: 1200, // 25 min
  shortBreakDuration: 300, // 5 min
  longBreakDuration: 1200, // 15 min
  sessionsBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  autoStartBreaks: true,
  autoStartWork: true,
};

export function usePomodoro() {
  const [state, setState] = useState<PomodoroState>({
    status: "idle",
    timeLeft: DEFAULT_CONFIG.workDuration,
    currentSession: 0,
    sessionType: "work",
    attachedBlockId: null,
    attachedBlockTitle: null,
    attachedTaskId: null,
  });

  const [config, setConfig] = useState<PomodoroConfig>(DEFAULT_CONFIG);
  const startTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load config from Dexie on mount
  useEffect(() => {
    db.pomodoroSettings.get("default").then((saved) => {
      if (saved) {
        const loaded: PomodoroConfig = {
          workDuration: saved.workDuration,
          shortBreakDuration: saved.shortBreakDuration,
          longBreakDuration: saved.longBreakDuration,
          sessionsBeforeLongBreak: saved.sessionsBeforeLongBreak,
          soundEnabled: saved.soundEnabled,
          notificationsEnabled: saved.notificationsEnabled,
          autoStartBreaks: saved.autoStartBreaks ?? true,
          autoStartWork: saved.autoStartWork ?? true,
        };
        setConfig(loaded);
        setState((prev) => ({
          ...prev,
          timeLeft: loaded.workDuration,
        }));
      }
    });
  }, []);

  // Step 4: Browser tab countdown
  useEffect(() => {
    if (state.status === "idle") {
      document.title = "Timebox - Deep Work & Hourly Planning";
      return;
    }
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    const label = state.sessionType === "work" ? "🍅" : "☕";
    document.title = `${label} ${display} - Timebox`;
  }, [state.timeLeft, state.status, state.sessionType]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (startTimeRef.current === null) return;
    const now = Date.now();
    const elapsed =
      elapsedRef.current + Math.floor((now - startTimeRef.current) / 1000);
    const completedAt = startTimeRef.current;

    setState((prev) => {
      let duration: number;
      if (prev.sessionType === "work") duration = config.workDuration;
      else if (prev.sessionType === "shortBreak")
        duration = config.shortBreakDuration;
      else duration = config.longBreakDuration;

      const remaining = Math.max(0, duration - elapsed);

      // Step 5: Countdown tick last 5 seconds
      if (remaining <= 5 && remaining > 0 && config.soundEnabled) {
        playTick();
      }

      if (remaining === 0) {
        // Session complete
        clearTimer();
        startTimeRef.current = null;

        if (prev.sessionType === "work") {
          // Persist session to Dexie
          const session: PomodoroSession = {
            id: Math.random().toString(36).substring(2, 11),
            taskId: prev.attachedTaskId,
            date: new Date().toISOString().split("T")[0],
            startedAt: completedAt
              ? new Date(completedAt).toISOString()
              : new Date().toISOString(),
            duration: duration,
            type: "work",
          };
          db.pomodoroSessions.add(session).catch(() => {});

          if (config.soundEnabled) playComplete();
          if (config.notificationsEnabled && hasPermission()) {
            show("Pomodoro Complete", {
              body: "Time for a break!",
              tag: "pomodoro",
            });
          }

          const nextSession = prev.currentSession + 1;
          const isLongBreak =
            nextSession % config.sessionsBeforeLongBreak === 0;
          const nextType = isLongBreak ? "longBreak" : "shortBreak";
          const nextTime = isLongBreak
            ? config.longBreakDuration
            : config.shortBreakDuration;

          // Transition to break — autoStart handled by useEffect below
          return {
            ...prev,
            status: config.autoStartBreaks ? "running" : "break",
            timeLeft: nextTime,
            currentSession: nextSession,
            sessionType: nextType,
          };
        } else {
          // Break complete, back to work
          if (config.soundEnabled) playBeep();
          if (config.notificationsEnabled && hasPermission()) {
            show("Break Over", { body: "Time to focus!", tag: "pomodoro" });
          }

          // Transition to work — autoStart handled by useEffect below
          return {
            ...prev,
            status: config.autoStartWork ? "running" : "idle",
            timeLeft: config.workDuration,
            sessionType: "work",
          };
        }
      }

      return { ...prev, timeLeft: remaining };
    });
  }, [config, clearTimer]);

  // Auto-start: when status transitions to "running" for a new session type,
  // set up the interval. This runs AFTER setState, so the DOM is updated.
  useEffect(() => {
    if (state.status === "running" && intervalRef.current === null) {
      startTimeRef.current = Date.now();
      elapsedRef.current = 0;
      intervalRef.current = setInterval(tick, 1000);
    }
  }, [state.status, state.sessionType, tick]);

  const start = useCallback(() => {
    if (state.status !== "idle" && state.status !== "paused") return;
    clearTimer();
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(tick, 1000);
    if (config.soundEnabled) playTick();
    setState((prev) => ({ ...prev, status: "running" }));
  }, [state.status, tick, clearTimer, config.soundEnabled]);

  const pause = useCallback(() => {
    if (state.status !== "running") return;
    clearTimer();
    if (startTimeRef.current) {
      elapsedRef.current += Math.floor(
        (Date.now() - startTimeRef.current) / 1000,
      );
    }
    startTimeRef.current = null;
    setState((prev) => ({ ...prev, status: "paused" }));
  }, [state.status, clearTimer]);

  const resume = useCallback(() => {
    start();
  }, [start]);

  const stop = useCallback(() => {
    clearTimer();
    startTimeRef.current = null;
    elapsedRef.current = 0;
    setState((prev) => ({
      ...prev,
      status: "idle",
      timeLeft:
        prev.sessionType === "work"
          ? config.workDuration
          : config.shortBreakDuration,
      sessionType: "work",
      attachedBlockId: null,
      attachedBlockTitle: null,
      attachedTaskId: null,
    }));
  }, [clearTimer, config.workDuration, config.shortBreakDuration]);

  const reset = useCallback(() => {
    stop();
    setState((prev) => ({
      ...prev,
      currentSession: 0,
      timeLeft: config.workDuration,
    }));
  }, [stop, config.workDuration]);

  const attachBlock = useCallback(
    (blockId: string, title: string, taskId: string | null) => {
      setState((prev) => ({
        ...prev,
        attachedBlockId: blockId,
        attachedBlockTitle: title,
        attachedTaskId: taskId,
      }));
    },
    [],
  );

  const toggle = useCallback(() => {
    if (state.status === "idle") start();
    else if (state.status === "running") pause();
    else if (state.status === "paused") resume();
  }, [state.status, start, pause, resume]);

  return {
    ...state,
    config,
    setConfig,
    start,
    pause,
    resume,
    stop,
    reset,
    toggle,
    attachBlock,
  };
}
