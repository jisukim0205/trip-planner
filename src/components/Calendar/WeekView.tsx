import type { Trip, CalendarEvent, PlanBlock } from '../../types';
import { useTripStore } from '../../store/useTripStore';
import { addDays, formatHour } from '../../utils/dates';
import EventChip from './EventChip';
import TimeSlotCell from './TimeSlotCell';

interface WeekViewProps {
  trip: Trip;
}

interface PositionedEvent {
  event: CalendarEvent;
  block: PlanBlock;
  colIdx: number;
  totalCols: number;
}

function getOverlapLayout(events: CalendarEvent[]): Map<string, { colIdx: number; totalCols: number }> {
  // Sort by startHour
  const sorted = [...events].sort((a, b) => a.startHour - b.startHour);
  const result = new Map<string, { colIdx: number; totalCols: number }>();

  // Simple greedy column assignment
  const columns: number[] = []; // tracks end hour of last event in each column

  for (const ev of sorted) {
    const endHour = ev.startHour + ev.duration;
    // Find first column where last event ended before this one starts
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      if (columns[c] <= ev.startHour) {
        columns[c] = endHour;
        result.set(ev.id, { colIdx: c, totalCols: 0 }); // totalCols filled after
        placed = true;
        break;
      }
    }
    if (!placed) {
      result.set(ev.id, { colIdx: columns.length, totalCols: 0 });
      columns.push(endHour);
    }
  }

  // Now determine totalCols for each event: count how many events overlap it
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

const ROW_HEIGHT = 56; // px per hour
const TIME_COL_WIDTH = 64; // px

export default function WeekView({ trip }: WeekViewProps) {
  const { currentWeekStart, planBlocks, calendarEvents } = useTripStore();

  // Build array of 7 day strings starting from currentWeekStart
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(currentWeekStart, i));
  }

  const hours: number[] = [];
  for (let h = trip.gridStartHour; h < trip.gridEndHour; h++) {
    hours.push(h);
  }

  // Filter calendarEvents for this trip and visible days
  const tripEvents = calendarEvents.filter(
    (e) => e.tripId === trip.id && days.includes(e.date)
  );

  // Group by date
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const day of days) {
    eventsByDate.set(day, tripEvents.filter((e) => e.date === day));
  }

  // Build positioned events per day
  function getPositionedEvents(day: string): PositionedEvent[] {
    const dayEvents = eventsByDate.get(day) ?? [];
    const layout = getOverlapLayout(dayEvents);
    return dayEvents.map((ev) => {
      const block = planBlocks.find((b) => b.id === ev.planBlockId);
      const pos = layout.get(ev.id) ?? { colIdx: 0, totalCols: 1 };
      return { event: ev, block: block!, colIdx: pos.colIdx, totalCols: pos.totalCols };
    }).filter((p) => p.block != null);
  }

  function isInTripRange(day: string): boolean {
    return day >= trip.startDate && day <= trip.endDate;
  }

  function isWeekend(day: string): boolean {
    const d = new Date(day + 'T00:00:00');
    const dow = d.getDay(); // 0=Sun, 6=Sat
    return dow === 0 || dow === 6;
  }

  function dayHeaderLabel(day: string): { weekday: string; date: string } {
    const d = new Date(day + 'T00:00:00');
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const date = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    return { weekday, date };
  }

  return (
    <div className="flex-1 overflow-auto relative pb-[40vh] md:pb-0">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 bg-white border-b border-gray-200 flex"
        style={{ paddingLeft: TIME_COL_WIDTH }}
      >
        {days.map((day) => {
          const { weekday, date } = dayHeaderLabel(day);
          const inRange = isInTripRange(day);
          const isToday = day === new Date().toISOString().split('T')[0];
          const weekend = isWeekend(day);
          return (
            <div
              key={day}
              className={`flex-1 min-w-0 text-center py-2 border-r border-gray-200 last:border-r-0 ${
                isToday ? 'bg-indigo-50' : !inRange ? 'bg-gray-100 text-gray-300' : weekend ? 'bg-gray-50' : ''
              }`}
            >
              <div className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                {weekday}
              </div>
              <div className={`text-sm font-bold ${isToday ? 'text-indigo-600' : 'text-gray-800'}`}>
                {date}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid body */}
      <div className="flex">
        {/* Time labels column */}
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

        {/* Day columns */}
        {days.map((day) => {
          const inRange = isInTripRange(day);
          const positioned = getPositionedEvents(day);

          return (
            <div
              key={day}
              className={`flex-1 min-w-0 border-r border-gray-200 last:border-r-0 relative ${
                !inRange ? 'bg-gray-100' : isWeekend(day) ? 'bg-gray-50' : 'bg-white'
              }`}
              style={{ height: hours.length * ROW_HEIGHT }}
            >
              {/* Hour rows as drop targets */}
              {hours.map((h) => (
                <TimeSlotCell
                  key={h}
                  date={day}
                  hour={h}
                  height={ROW_HEIGHT}
                  isInRange={inRange}
                />
              ))}

              {/* Events */}
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

              {/* Continuation chips: events from the previous day that span into this day */}
              {(() => {
                const prevDay = addDays(day, -1);
                const prevEvents = calendarEvents.filter(
                  (e) => e.tripId === trip.id && e.date === prevDay &&
                  e.startHour + e.duration > trip.gridEndHour
                );
                return prevEvents.map((ev) => {
                  const block = planBlocks.find((b) => b.id === ev.planBlockId);
                  if (!block) return null;
                  const overhang = (ev.startHour + ev.duration) - trip.gridEndHour;
                  const clampedOverhang = Math.min(overhang, trip.gridEndHour - trip.gridStartHour);
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
                });
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
