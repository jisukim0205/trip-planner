import { useState, useEffect } from 'react';
import type { Trip } from '../../types';
import { useTripStore } from '../../store/useTripStore';
import { useDndApp } from '../../context/DndAppContext';
import { addDays, formatDate } from '../../utils/dates';

interface CalendarHeaderProps {
  trip: Trip;
}

export default function CalendarHeader({ trip }: CalendarHeaderProps) {
  const { currentView, currentWeekStart, setCurrentView, setCurrentWeekStart } = useTripStore();
  const { isMobile, isLandscape } = useDndApp();
  const [showRotateToast, setShowRotateToast] = useState(false);

  // Hide toast after 3 seconds
  useEffect(() => {
    if (!showRotateToast) return;
    const t = setTimeout(() => setShowRotateToast(false), 3000);
    return () => clearTimeout(t);
  }, [showRotateToast]);

  // Auto-hide toast when user rotates to landscape
  useEffect(() => {
    if (isLandscape) setShowRotateToast(false);
  }, [isLandscape]);

  const currentDay = currentWeekStart;

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

  const canPrevWeek = currentWeekStart > trip.startDate;
  const canNextWeek = addDays(currentWeekStart, 6) < trip.endDate;
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

  function handleWeekClick() {
    setCurrentView('week');
    // On mobile portrait, show rotate hint instead of switching
    if (isMobile && !isLandscape) {
      setShowRotateToast(true);
    }
  }

  // The effective view shown in the navigation row
  // On mobile portrait → always day; on mobile landscape → week if selected
  const effectiveView = isMobile && !isLandscape && currentView === 'week' ? 'day' : currentView;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col gap-2 flex-shrink-0 relative">
      {/* Rotate to landscape toast */}
      {showRotateToast && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 px-4 py-2 bg-gray-800 text-white text-xs rounded-xl shadow-lg whitespace-nowrap flex items-center gap-2 animate-fade-in">
          <span>📱</span>
          <span>가로로 돌리면 주간 뷰를 볼 수 있어요</span>
        </div>
      )}

      {/* Top row: trip info + view toggle */}
      <div className="flex items-center justify-between gap-2 pl-10 md:pl-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl px-3 py-1 text-sm font-bold shadow-sm truncate max-w-[140px] md:max-w-[180px]">
            {trip.title}
          </div>
          <span className="text-gray-500 text-sm truncate hidden sm:block">{trip.destination}</span>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-full p-1 gap-0.5 flex-shrink-0">
          <button
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
              currentView === 'day'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setCurrentView('day')}
          >
            Day
          </button>
          <button
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
              currentView === 'week'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={handleWeekClick}
          >
            Week
          </button>
          <button
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
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

      {/* Navigation row */}
      {effectiveView !== 'map' && (
        <div className="flex items-center gap-2">
          {effectiveView === 'week' ? (
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
        </div>
      )}
    </div>
  );
}
