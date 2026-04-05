import { useState } from 'react';
import { useTripStore } from '../../store/useTripStore';
import type { Trip } from '../../types';
import NewTripModal from '../Modals/NewTripModal';
import EditTripModal from '../Modals/EditTripModal';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { trips, currentTripId, setCurrentTrip, deleteTrip, setCurrentWeekStart } = useTripStore();

  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [hoveredTripId, setHoveredTripId] = useState<string | null>(null);

  function handleSelectTrip(trip: Trip) {
    setCurrentTrip(trip.id);
    setCurrentWeekStart(trip.startDate);
    // Close drawer on mobile after selecting
    setSidebarOpen(false);
  }

  function handleDeleteTrip(e: React.MouseEvent, tripId: string) {
    e.stopPropagation();
    if (window.confirm('Delete this trip and all its plans? This cannot be undone.')) {
      deleteTrip(tripId);
    }
  }

  function handleEditTrip(e: React.MouseEvent, trip: Trip) {
    e.stopPropagation();
    setEditingTrip(trip);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-indigo-600 to-violet-700 select-none">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg leading-tight tracking-wide">✈️ Trip Planner</h1>
          <p className="text-white/60 text-xs mt-0.5">Plan your adventures</p>
        </div>
        {/* Close button — mobile only */}
        <button
          className="md:hidden text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l12 12M16 4L4 16" />
          </svg>
        </button>
      </div>

      {/* New Trip button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setShowNewTripModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold transition-colors border border-white/20"
        >
          <span className="text-lg leading-none">+</span>
          <span>New Trip</span>
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/15 mb-3" />

      {/* Trip list */}
      <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
        {trips.length === 0 ? (
          <p className="text-white/50 text-xs text-center mt-6 px-4">
            No trips yet. Create your first trip!
          </p>
        ) : (
          trips.map((trip) => {
            const isActive = trip.id === currentTripId;
            const isHovered = hoveredTripId === trip.id;
            return (
              <div
                key={trip.id}
                onClick={() => handleSelectTrip(trip)}
                onMouseEnter={() => setHoveredTripId(trip.id)}
                onMouseLeave={() => setHoveredTripId(null)}
                className={`
                  group relative flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors
                  ${isActive
                    ? 'bg-white/20 ring-1 ring-white/30'
                    : 'hover:bg-white/10'}
                `}
              >
                {/* Trip info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate leading-tight ${isActive ? 'text-white' : 'text-white/90'}`}>
                    {trip.title}
                  </p>
                  <p className="text-xs text-white/60 truncate mt-0.5">{trip.destination}</p>
                  <p className="text-xs text-white/45 mt-0.5">
                    {trip.startDate} – {trip.endDate}
                  </p>
                </div>

                {/* Action icons — visible on hover or active */}
                <div className={`flex items-center gap-1 shrink-0 transition-opacity ${(isHovered || isActive) ? 'opacity-100' : 'opacity-0'}`}>
                  {/* Edit */}
                  <button
                    onClick={(e) => handleEditTrip(e, trip)}
                    className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                    title="Edit trip"
                    aria-label="Edit trip"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5z" />
                    </svg>
                  </button>
                  {/* Delete */}
                  <button
                    onClick={(e) => handleDeleteTrip(e, trip.id)}
                    className="p-1 rounded-lg text-white/70 hover:text-red-300 hover:bg-white/20 transition-colors"
                    title="Delete trip"
                    aria-label="Delete trip"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 4h12M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/10">
        <p className="text-white/30 text-xs">v0.1.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-in drawer */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 z-40 h-full w-[220px] flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Modals */}
      {showNewTripModal && (
        <NewTripModal onClose={() => setShowNewTripModal(false)} />
      )}
      {editingTrip && (
        <EditTripModal trip={editingTrip} onClose={() => setEditingTrip(null)} />
      )}
    </>
  );
}
