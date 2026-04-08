import type { Trip, CalendarEvent, PlanBlock } from '../../types';
import { useTripStore } from '../../store/useTripStore';
import { useDndApp } from '../../context/DndAppContext';
import { addDays, formatHour } from '../../utils/dates';
import EventChip from './EventChip';
import TimeSlotCell from './TimeSlotCell';

interface DayViewProps {
  trip: Trip;
}

interface PositionedEvent {
  event: CalendarEvent;
  block: PlanBlock;
  colIdx: number;
  totalCols: number;
}

function getOverlapLayout(events: CalendarEvent[]): Map<string, { colIdx: number; totalCols: number }> {
  const sorted = [...events].sort((a, b) => a.startHour - b.startHour);
  const result = new Map<string, { colIdx: number; totalCols: number }>();
  const columns: number[] = [];

  for (const ev of sorted) {
    const endHour = ev.startHour + ev.duration;
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      if (columns[c] <= ev.startHour) {
        columns[c] = endHour;
        result.set(ev.id, { colIdx: c, totalCols: 0 });
        placed = true;
        break;
      }
    }
    if (!placed) {
      result.set(ev.id, { colIdx: columns.length, totalCols: 0 });
      columns.push(endHour);
    }
  }

  for (const ev of sorted) {
    let maxCol = 0;
    for (const other of sorted) {
      const otherEnd = other.startHour + other.duration;
      const evEnd = ev.startHour + ev.duration;
      const overlaps = other.startHour < evEnd && otherEnd > ev.startHour;
      if (overlaps) {
        const c = result.get(other.id)!.colIdx;
        if (c > maxCol) maxCol = c;
      }
    }
    const existing = result.get(ev.id)!;
    result.set(ev.id, { ...existing, totalCols: maxCol + 1 });
  }

  return result;
}

const ROW_HEIGHT = 56;

export default function DayView({ trip }: DayViewProps) {
  const { currentWeekStart, planBlocks, calendarEvents } = useTripStore();
  const { isMobile } = useDndApp();
  const TIME_COL_WIDTH = isMobile ? 44 : 64;

  // currentWeekStart is reused as "current day" in day view
  const currentDay = currentWeekStart;

  const hours: number[] = [];
  for (let h = trip.gridStartHour; h < trip.gridEndHour; h++) {
    hours.push(h);
  }

  const dayEvents = calendarEvents.filter(
    (e) => e.tripId === trip.id && e.date === currentDay
  );

  const layout = getOverlapLayout(dayEvents);

  const positioned: PositionedEvent[] = dayEvents.map((ev) => {
    const block = planBlocks.find((b) => b.id === ev.planBlockId);
    const pos = layout.get(ev.id) ?? { colIdx: 0, totalCols: 1 };
    return { event: ev, block: block!, colIdx: pos.colIdx, totalCols: pos.totalCols };
  }).filter((p) => p.block != null);

  const isInRange = currentDay >= trip.startDate && currentDay <= trip.endDate;

  // Continuation chips from previous day
  const prevDay = addDays(currentDay, -1);
  const prevDaySpillovers = calendarEvents.filter(
    (e) =>
      e.tripId === trip.id &&
      e.date === prevDay &&
      e.startHour + e.duration > trip.gridEndHour
  );

  const dayLabel = (() => {
    const d = new Date(currentDay + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  })();

  return (
    <div className="flex-1 overflow-auto relative pb-[40vh] md:pb-0">
      {/* Day header */}
      <div
        className="sticky top-0 z-20 bg-white border-b border-gray-200 flex"
        style={{ paddingLeft: TIME_COL_WIDTH }}
      >
        <div className="flex-1 text-center py-2 border-r border-gray-200">
          <div className="text-sm font-bold text-gray-800">{dayLabel}</div>
          {!isInRange && (
            <div className="text-xs text-gray-400">Outside trip range</div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex">
        {/* Time labels */}
        <div
          className="flex-shrink-0 border-r border-gray-200"
          style={{ width: TIME_COL_WIDTH }}
        >
          {hours.map((h) => (
            <div
              key={h}
              className="border-b border-gray-100 flex items-start justify-end pr-2 pt-1"
              style={{ height: ROW_HEIGHT }}
            >
              <span className="text-xs text-gray-400 font-medium">{formatHour(h)}</span>
            </div>
          ))}
        </div>

        {/* Single day column */}
        <div
          className={`flex-1 relative ${isInRange ? 'bg-white' : 'bg-gray-50'}`}
          style={{ height: hours.length * ROW_HEIGHT }}
        >
          {/* Hour rows as drop targets */}
          {hours.map((h) => (
            <TimeSlotCell
              key={h}
              date={currentDay}
              hour={h}
              height={ROW_HEIGHT}
              isInRange={isInRange}
              showHint={isInRange && dayEvents.length === 0 && h === trip.gridStartHour + 1}
            />
          ))}

          {/* Placed events */}
          {positioned.map(({ event, block, colIdx, totalCols }) => {
            const top = (event.startHour - trip.gridStartHour) * ROW_HEIGHT;
            const clampedDuration = Math.min(
              event.duration,
              trip.gridEndHour - event.startHour
            );
            const height = clampedDuration * ROW_HEIGHT - 2;
            const widthPct = 100 / totalCols;
            const leftPct = (colIdx / totalCols) * 100;

            return (
              <EventChip
                key={event.id}
                event={event}
                block={block}
                isContinuation={false}
                style={{
                  top: top + 1,
                  height,
                  left: `${leftPct}%`,
                  width: `calc(${widthPct}% - 2px)`,
                }}
              />
            );
          })}

          {/* Continuation chips from previous day */}
          {prevDaySpillovers.map((ev) => {
            const block = planBlocks.find((b) => b.id === ev.planBlockId);
            if (!block) return null;
            const overhang = ev.startHour + ev.duration - trip.gridEndHour;
            const clampedOverhang = Math.min(
              overhang,
              trip.gridEndHour - trip.gridStartHour
            );
            const height = clampedOverhang * ROW_HEIGHT - 2;
            return (
              <EventChip
                key={`cont-${ev.id}`}
                event={ev}
                block={block}
                isContinuation={true}
                continuationHours={overhang}
                style={{
                  top: 1,
                  height,
                  left: '0%',
                  width: 'calc(100% - 2px)',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
