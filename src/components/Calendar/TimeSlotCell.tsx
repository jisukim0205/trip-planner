import { useDroppable } from '@dnd-kit/core';
import { useDndApp } from '../../context/DndAppContext';
import { useTripStore } from '../../store/useTripStore';

interface TimeSlotCellProps {
  date: string;
  hour: number;
  height: number;
  isInRange: boolean;
  showHint?: boolean;
}

export default function TimeSlotCell({ date, hour, height, isInRange, showHint }: TimeSlotCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${date}-${hour}`,
    data: { type: 'time-slot', date, hour },
  });

  const { selectedBlockId, setSelectedBlockId, isMobile } = useDndApp();
  const { planBlocks, calendarEvents, addCalendarEvent, updateCalendarEvent, currentTripId, trips } = useTripStore();

  function handleClick() {
    if (!isMobile || !selectedBlockId || !isInRange) return;

    const block = planBlocks.find((b) => b.id === selectedBlockId);
    if (!block) return;

    const trip = trips.find((t) => t.id === currentTripId);
    if (!trip) return;

    // Mobile two-step tap: place the selected block
    const existingEvent = calendarEvents.find((e) => e.planBlockId === block.id);
    if (existingEvent && !block.repeatable) {
      updateCalendarEvent(existingEvent.id, { date, startHour: hour });
    } else {
      addCalendarEvent({
        id: crypto.randomUUID(),
        tripId: trip.id,
        planBlockId: block.id,
        date,
        startHour: hour,
        duration: block.duration,
      });
    }
    setSelectedBlockId(null);
  }

  // Highlight differently if a block is selected on mobile and slot is in range
  const mobileReady = isMobile && !!selectedBlockId && isInRange;

  return (
    <div
      ref={setNodeRef}
      className={`border-b border-gray-100 transition-colors ${
        isOver ? 'bg-indigo-100/60' : mobileReady ? 'bg-indigo-50/40 cursor-pointer' : isInRange ? 'hover:bg-indigo-50/30' : ''
      }`}
      style={{ height }}
      data-date={date}
      data-hour={hour}
      onClick={handleClick}
    >
      {showHint && (
        <div className="flex items-center justify-center h-full text-gray-300 text-xs pointer-events-none select-none">
          {isMobile && selectedBlockId ? 'Tap to place here' : 'Drag plans here'}
        </div>
      )}
    </div>
  );
}
