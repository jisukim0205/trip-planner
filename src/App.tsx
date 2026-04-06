import { useState, useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, Modifier } from '@dnd-kit/core';
import { useTripStore } from './store/useTripStore';
import { createSeedData } from './utils/seed';
import Sidebar from './components/Sidebar';
import PlanPanel from './components/PlanPanel';
import Calendar from './components/Calendar';
import { DndAppProvider, useDndApp } from './context/DndAppContext';
import { COLOR_MAP, COLOR_HEX } from './utils/colors';

/**
 * Custom modifier: shifts the DragOverlay so its top-left corner
 * is exactly at the pointer, regardless of where inside the element
 * the user grabbed it.
 */
const snapToCursor: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (draggingNodeRect && activatorEvent) {
    const { clientX, clientY } = activatorEvent as PointerEvent;
    return {
      ...transform,
      x: transform.x + clientX - draggingNodeRect.left,
      y: transform.y + clientY - draggingNodeRect.top,
    };
  }
  return transform;
};

/** EventChip-style ghost rendered inside DragOverlay while dragging */
function DragGhost({ label, color, duration }: { label: string; color: string; duration: number }) {
  const colors = COLOR_MAP[color as keyof typeof COLOR_MAP] ?? COLOR_MAP.coral;
  const hex = COLOR_HEX[color as keyof typeof COLOR_HEX] ?? COLOR_HEX.coral;
  return (
    <div
      className={`rounded-lg shadow-xl select-none ${colors.bg} ${colors.text} opacity-95 pointer-events-none`}
      style={{
        borderLeft: `3px solid ${hex}`,
        padding: '4px 8px',
        fontSize: '12px',
        width: 140,
      }}
    >
      <div className="font-semibold truncate leading-tight">{label}</div>
      <div className="opacity-70 text-[10px] leading-tight">{duration}h</div>
    </div>
  );
}

/** Inner component — consumes DndAppContext so it can update isDragging */
function AppContent() {
  const {
    _seeded,
    setSeedDone,
    addTrip,
    addPlanBlock,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    setCurrentTrip,
    setCurrentWeekStart,
    trips,
    planBlocks,
    calendarEvents,
    currentTripId,
  } = useTripStore();

  const { setIsDragging } = useDndApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeItem, setActiveItem] = useState<{
    type: 'plan-block' | 'calendar-event';
    label: string;
    color: string;
    duration: number;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!_seeded && trips.length === 0) {
        const { trip, blocks, events } = createSeedData();
        addTrip(trip);
        blocks.forEach(addPlanBlock);
        events.forEach(addCalendarEvent);
        setCurrentTrip(trip.id);
        setCurrentWeekStart(trip.startDate);
        setSeedDone();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setIsDragging(true);
    const data = event.active.data.current;
    if (!data) return;

    if (data.type === 'plan-block') {
      const block = planBlocks.find((b) => b.id === data.blockId);
      if (block) {
        setActiveItem({ type: 'plan-block', label: block.title, color: block.color, duration: block.duration });
      }
    } else if (data.type === 'calendar-event') {
      const ev = calendarEvents.find((e) => e.id === data.eventId);
      const block = planBlocks.find((b) => b.id === data.blockId);
      if (block) {
        setActiveItem({ type: 'calendar-event', label: block.title, color: block.color, duration: ev?.duration ?? block.duration });
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    const trip = trips.find((t) => t.id === currentTripId);
    if (!trip) return;

    // Case 1: PlanBlock dropped on time slot → create CalendarEvent
    if (activeData.type === 'plan-block' && overData.type === 'time-slot') {
      const block = planBlocks.find((b) => b.id === activeData.blockId);
      if (!block) return;

      const existingEvent = calendarEvents.find((e) => e.planBlockId === block.id);
      if (existingEvent && !block.repeatable) {
        updateCalendarEvent(existingEvent.id, {
          date: overData.date,
          startHour: overData.hour,
        });
        return;
      }

      addCalendarEvent({
        id: crypto.randomUUID(),
        tripId: trip.id,
        planBlockId: block.id,
        date: overData.date,
        startHour: overData.hour,
        duration: block.duration,
      });
      return;
    }

    // Case 2: CalendarEvent dropped on time slot → move
    if (activeData.type === 'calendar-event' && overData.type === 'time-slot') {
      updateCalendarEvent(activeData.eventId, {
        date: overData.date,
        startHour: overData.hour,
      });
      return;
    }

    // Case 3: CalendarEvent dropped on plan panel → unschedule
    if (activeData.type === 'calendar-event' && overData.type === 'plan-panel') {
      deleteCalendarEvent(activeData.eventId);
      return;
    }
  }

  return (
    <DndContext sensors={sensors} modifiers={[snapToCursor]} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex bg-[#f5f5f7] overflow-hidden">
        {/* Mobile hamburger button */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>

        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <PlanPanel />
        <Calendar />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <DragGhost label={activeItem.label} color={activeItem.color} duration={activeItem.duration} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default function App() {
  return (
    <DndAppProvider>
      <AppContent />
    </DndAppProvider>
  );
}
