import type { Trip } from '../../types';
import { useTripStore } from '../../store/useTripStore';
import { addDays, formatDate } from '../../utils/dates';

interface CalendarHeaderProps {
  trip: Trip;
}

export default function CalendarHeader({ trip }: CalendarHeaderProps) {
  const { currentView, currentWeekStart, setCurrentView, setCurrentWeekStart } = useTripStore();

  // In day view, currentWeekStart doubles as the current single day
  const currentDay = currentWeekStart;

  // Compute the label for the current week window
  function weekLabel(): string {
    const weekEnd = addDays(currentWeekStart, 6);
    const start = new Date(currentWeekStart + 'T00:00:00');
    const end = new Date(weekEnd + 'T00:00:00');
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
  }

  function dayLabel(): string {
    return formatDate(currentDay);
  }

  // Week view: disable prev when window already starts at/before trip start,
  // disable next when the next window's start would be after trip end
  const canPrevWeek = currentWeekStart > trip.startDate;
  const canNextWeek = addDays(currentWeekStart, 6) < trip.endDate;

  // Day view: disable at trip boundaries
  const canPrevDay = currentDay > trip.startDate;
  const canNextDay = currentDay < trip.endDate;

  function handlePrevWeek() {
    if (!canPrevWeek) return;
    setCurrentWeekStart(addDays(currentWeekStart, -1));
  }

  function handleNextWeek() {
    if (!canNextWeek) return;
    setCurrentWeekStart(addDays(currentWeekStart, 1));
  }

  function handlePrevDay() {
    if (!canPrevDay) return;
    setCurrentWeekStart(addDays(currentDay, -1));
  }

  function handleNextDay() {
    if (!canNextDay) return;
    setCurrentWeekStart(addDays(currentDay, 1));
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col gap-2 flex-shrink-0">
      {/* Top row: trip info */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl px-3 py-1 text-sm font-bold shadow-sm truncate max-w-[180px]">
            {trip.title}
          </div>
          <span className="text-gray-500 text-sm truncate">{trip.destination}</span>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-full p-1 gap-1 flex-shrink-0">
          <button
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
              currentView === 'day'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setCurrentView('day')}
          >
            Day
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
              currentView === 'week'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setCurrentView('week')}
          >
            Week
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
              currentView === 'map'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setCurrentView('map')}
          >
            Map
          </button>
        </div>
      </div>

      {/* Bottom row: navigation (hidden in map view) */}
      {currentView !== 'map' && <div className="flex items-center gap-2">
        {currentView === 'week' ? (
          <>
            <button
              className={`w-7 h-7 flex items-center justify-center rounded-full font-bold transition-colors ${
                canPrevWeek ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
              }`}
              onClick={handlePrevWeek}
              disabled={!canPrevWeek}
              aria-label="Previous week"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-700 flex-1 text-center">
              {weekLabel()}
            </span>
            <button
              className={`w-7 h-7 flex items-center justify-center rounded-full font-bold transition-colors ${
                canNextWeek ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
              }`}
              onClick={handleNextWeek}
              disabled={!canNextWeek}
              aria-label="Next week"
            >
              ›
            </button>
          </>
        ) : (
          <>
            <button
              className={`w-7 h-7 flex items-center justify-center rounded-full font-bold transition-colors ${
                canPrevDay ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
              }`}
              onClick={handlePrevDay}
              disabled={!canPrevDay}
              aria-label="Previous day"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-700 flex-1 text-center">
              {dayLabel()}
            </span>
            <button
              className={`w-7 h-7 flex items-center justify-center rounded-full font-bold transition-colors ${
                canNextDay ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
              }`}
              onClick={handleNextDay}
              disabled={!canNextDay}
              aria-label="Next day"
            >
              ›
            </button>
          </>
        )}
      </div>}
    </div>
  );
}
