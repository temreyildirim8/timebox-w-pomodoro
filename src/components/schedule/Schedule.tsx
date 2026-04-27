/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TimeBlock, Task } from "../../types";
import { useDroppable } from "@dnd-kit/core";
import { EventContextMenu } from "./EventContextMenu";

interface ScheduleProps {
  selectedDate: string;
  timeBlocks: TimeBlock[];
  tasks: Task[];
  deleteTimeBlock: (id: string) => void;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void;
  setDate: (date: string) => void;
  scheduleTask: (
    taskId: string,
    startTime: string,
    durationMinutes?: number,
  ) => void;
  unscheduleTask: (taskId: string) => void;
}

export const Schedule: React.FC<ScheduleProps> = ({
  selectedDate,
  timeBlocks,
  tasks,
  deleteTimeBlock,
  updateTimeBlock,
  setDate,
  scheduleTask,
  unscheduleTask,
}) => {
  const calendarRef = useRef<FullCalendar>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - 1);
        setDate(format(date, "yyyy-MM-dd"));
      } else if (e.key === "ArrowRight") {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + 1);
        setDate(format(date, "yyyy-MM-dd"));
      } else if (e.key === "t" || e.key === "T") {
        // Go to today
        setDate(format(new Date(), "yyyy-MM-dd"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDate, setDate]);

  const scrollToCurrentTime = (smooth = true) => {
    if (!calendarRef.current) return;

    const calendarApi = calendarRef.current.getApi();
    if (calendarApi && isSameDay(new Date(), new Date(selectedDate))) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      // Offset by 1 hour (60 mins) from the top
      const scrollMinutes = Math.max(0, currentMinutes - 60);

      const pixelsPerMinute = 40 / 15;
      const scrollTop = scrollMinutes * pixelsPerMinute;

      const scroller = (
        calendarRef.current as any
      ).elRef.current?.querySelector(".fc-scroller");
      if (scroller) {
        scroller.scrollTo({
          top: scrollTop,
          behavior: smooth ? "smooth" : "auto",
        });
      }
    }
  };

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const currentCalDate = format(calendarApi.getDate(), "yyyy-MM-dd");
      if (currentCalDate !== selectedDate) {
        calendarApi.gotoDate(selectedDate);
      }
      setTimeout(() => scrollToCurrentTime(false), 200);
    }
  }, [selectedDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      scrollToCurrentTime(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const { setNodeRef, isOver } = useDroppable({
    id: "calendar-droppable",
    data: {
      type: "calendar",
    },
  });

  const events = useMemo(() => {
    return timeBlocks
      .filter((block) => {
        const blockDate = format(new Date(block.startTime), "yyyy-MM-dd");
        return blockDate === selectedDate;
      })
      .map((block) => {
        const task = tasks.find((t) => t.id === block.taskId);
        const isCompleted = task?.completed || false;

        return {
          id: block.id,
          title: block.title || "Untitled",
          start: block.startTime,
          end: block.endTime,
          backgroundColor: isCompleted
            ? "rgba(31, 41, 55, 0.6)"
            : task?.color || block.color || "#204784",
          borderColor: "transparent",
          className: isCompleted ? "event-completed" : "",
          extendedProps: { taskId: block.taskId, completed: isCompleted },
        };
      });
  }, [timeBlocks, tasks, selectedDate]);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    blockId: string;
    taskId: string;
    title: string;
    completed: boolean;
  } | null>(null);

  const handleEventDidMount = useCallback((info: any) => {
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        blockId: info.event.id,
        taskId: info.event.extendedProps.taskId,
        title: info.event.title,
        completed: info.event.extendedProps.completed,
      });
    };
    info.el.addEventListener("contextmenu", handler);
    return () => info.el.removeEventListener("contextmenu", handler);
  }, []);

  const handleEventChange = (info: any) => {
    const { event } = info;
    updateTimeBlock(event.id, {
      startTime: event.startStr,
      endTime: event.endStr,
    });
  };

  const handleEventReceive = (info: any) => {
    const { event } = info;
    const taskId = event.extendedProps.taskId;
    const startTime = event.startStr;
    event.remove();
    if (taskId) {
      scheduleTask(taskId, startTime);
    }
  };

  const handleEventDragStop = (info: any) => {
    const { jsEvent, event } = info;
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      if (
        jsEvent.clientX >= rect.left &&
        jsEvent.clientX <= rect.right &&
        jsEvent.clientY >= rect.top &&
        jsEvent.clientY <= rect.bottom
      ) {
        if (event.extendedProps.taskId) {
          unscheduleTask(event.extendedProps.taskId);
        } else {
          deleteTimeBlock(event.id);
        }
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      className="main-content"
      style={{
        backgroundColor: isOver ? "rgba(59, 130, 246, 0.05)" : "transparent",
        transition: "background-color 0.2s ease",
        borderRight: "1px solid var(--border)",
      }}
    >
      <header
        style={{
          flexShrink: 0,
          height: "100px",
          padding: "0 2rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "var(--bg-primary)",
          zIndex: 10,
        }}
      >
        <div className="animate-in delay-1">
          <h1
            style={{
              fontSize: "var(--display-lg)",
              fontFamily: "var(--font-display)",
              fontWeight: "var(--font-weight-display)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--text-primary)",
            }}
          >
            {format(new Date(selectedDate), "EEEE")}
          </h1>
          <p
            style={{
              fontSize: "var(--heading-md)",
              fontFamily: "var(--font-display)",
              fontWeight: "var(--font-weight-subheading)",
              letterSpacing: "-0.01em",
              color: "var(--text-secondary)",
              marginTop: "4px",
            }}
          >
            {format(new Date(selectedDate), "MMMM d")}
          </p>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          className="animate-in delay-2"
        >
          <button
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() - 1);
              setDate(format(date, "yyyy-MM-dd"));
            }}
            className="nav-btn"
            aria-label="Previous day"
          >
            <ChevronLeft size={20} />
          </button>
          <label htmlFor="date-picker" className="visually-hidden">
            Select date
          </label>
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => setDate(e.target.value)}
            className="date-picker"
          />
          <button
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() + 1);
              setDate(format(date, "yyyy-MM-dd"));
            }}
            className="nav-btn"
            aria-label="Next day"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="calendar-wrapper" style={{ flex: 1 }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          headerToolbar={false}
          allDaySlot={false}
          slotDuration="00:15:00"
          snapDuration="00:05:00"
          slotLabelInterval="01:00"
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            hour12: false,
          }}
          expandRows={true}
          height="100%"
          editable={true}
          selectable={false}
          droppable={true}
          forceEventDuration={true}
          events={events}
          eventChange={handleEventChange}
          eventReceive={handleEventReceive}
          eventDragStop={handleEventDragStop}
          eventDidMount={handleEventDidMount}
          nowIndicator={true}
          dayHeaders={false}
          themeSystem="standard"
          eventTextColor="#fff"
          eventDisplay="block"
        />
      </div>

      {contextMenu && (
        <EventContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          blockId={contextMenu.blockId}
          taskId={contextMenu.taskId}
          currentTitle={contextMenu.title}
          isCompleted={contextMenu.completed}
          onClose={() => setContextMenu(null)}
        />
      )}

      <style>{`
        .fc {
          --fc-border-color: var(--border);
          --fc-now-indicator-color: var(--accent-primary);
          --fc-today-bg-color: transparent;
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: transparent;
          --fc-list-event-hover-bg-color: var(--bg-elevated);
          font-family: var(--font-body);
        }
        .fc .fc-timegrid-slot {
          height: 40px !important;
          border-bottom: 0;
        }
        .fc .fc-timegrid-slot-minor {
          border-top-style: dashed;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--grid-line);
        }
        .fc-theme-standard .fc-scrollgrid {
          border: none;
        }
        .fc-theme-standard td {
          border-right: none !important;
        }
        .fc .fc-timegrid-now-indicator-line {
          border-width: 2px 0 0;
        }
        .fc .fc-timegrid-axis-frame,
        .fc .fc-timegrid-slot-label-cushion {
          justify-content: flex-end;
          padding-right: 12px;
          color: var(--text-tertiary);
          font-size: 0.7rem;
          font-family: var(--font-mono);
          text-transform: lowercase;
          letter-spacing: 0.02em;
        }
        .fc-scroller {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .fc-scroller::-webkit-scrollbar {
          display: none !important;
        }
        .fc-event {
          border-radius: 8px;
          padding: 6px 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: grab;
          font-size: 0.85rem;
          font-family: var(--font-body);
          font-weight: 500;
          border: none !important;
          transition: box-shadow 0.15s cubic-bezier(0.165, 0.84, 0.44, 1), transform 0.15s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .fc-event:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          transform: translateY(-1px);
        }
        .fc-event:active {
          cursor: grabbing;
          transform: scale(0.98);
        }
        .event-completed {
          opacity: 0.6;
        }
        .event-completed .fc-event-title,
        .event-completed .fc-event-time {
          color: var(--text-tertiary);
        }
        .fc-v-event .fc-event-main {
          color: var(--text-primary);
        }
        .fc-timegrid-event .fc-event-time {
          font-size: 0.75rem;
          font-family: var(--font-mono);
          margin-bottom: 4px;
          color: rgba(255, 255, 255, 0.8);
        }
        .context-menu {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          padding: 4px;
          min-width: 160px;
          z-index: 9999;
        }
        .context-menu-item {
          display: block;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.85rem;
          font-family: var(--font-body);
          cursor: pointer;
          text-align: left;
        }
        .context-menu-item:hover {
          background: var(--bg-hover);
        }
        .context-menu-rename {
          padding: 8px;
        }
        .context-menu-input {
          width: 100%;
          padding: 6px 8px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.85rem;
          font-family: var(--font-body);
          outline: none;
          box-sizing: border-box;
        }
        .context-menu-input:focus {
          border-color: var(--accent-primary);
        }
        .context-menu-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          justify-content: flex-end;
        }
        .context-menu-btn {
          padding: 4px 12px;
          border-radius: 4px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-primary);
          font-size: 0.8rem;
          cursor: pointer;
        }
        .context-menu-btn.save {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: #fff;
        }
      `}</style>
    </div>
  );
};
