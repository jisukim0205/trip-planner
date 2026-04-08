import { useState } from 'react';
import { useTripStore } from '../../store/useTripStore';
import { useDndApp } from '../../context/DndAppContext';
import CalendarHeader from './CalendarHeader';
import DayView from './DayView';
import WeekView from './WeekView';
import MapView from './MapView';
import NewTripModal from '../Modals/NewTripModal';

function EmptyCalendar() {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f5f7] gap-4 p-8">
      <div className="text-6xl">✈️</div>
      <h2 className="text-xl font-bold text-gray-700">여행을 추가하고 일정을 계획해보세요</h2>
      <p className="text-gray-400 text-sm text-center max-w-xs">
        사이드바에서 여행을 선택하거나 새로운 여행을 만들어 시작하세요.
      </p>
      <button
        onClick={() => setShowModal(true)}
        className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md"
      >
        + 첫 번째 여행 만들기
      </button>
      {showModal && <NewTripModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default function Calendar() {
  const { currentView, currentTripId, trips } = useTripStore();
  const { isMobile, isLandscape } = useDndApp();
  const trip = trips.find((t) => t.id === currentTripId);

  if (!trip) return <EmptyCalendar />;

  // Mobile portrait → always Day view
  // Mobile landscape → respect currentView (Week auto-shows if selected)
  // Desktop → always respect currentView
  const effectiveView =
    isMobile && !isLandscape && currentView === 'week' ? 'day' : currentView;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f5f7]">
      <CalendarHeader trip={trip} />
      {effectiveView === 'map' ? (
        <MapView trip={trip} />
      ) : effectiveView === 'day' ? (
        <DayView trip={trip} />
      ) : (
        <WeekView trip={trip} />
      )}
    </div>
  );
}
