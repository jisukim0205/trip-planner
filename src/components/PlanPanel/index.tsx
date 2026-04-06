import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useTripStore } from '../../store/useTripStore';
import PlanBlockCard from './PlanBlockCard';
import AddPlanModal from '../Modals/AddPlanModal';
import { useDndApp } from '../../context/DndAppContext';

const RESTING_HEIGHT = 40;   // vh
const EXPANDED_HEIGHT = 80;  // vh
const COLLAPSED_HEIGHT = 8;  // vh

export default function PlanPanel() {
  const { planBlocks, calendarEvents, currentTripId } = useTripStore();
  const { selectedBlockId, isDragging } = useDndApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(RESTING_HEIGHT);
  // Disable CSS transition while user is manually dragging the handle
  const isManualDragging = useRef(false);

  // Auto-collapse when a block is selected (two-step tap) or drag starts
  useEffect(() => {
    if (selectedBlockId || isDragging) {
      setSheetHeight(COLLAPSED_HEIGHT);
    } else {
      setSheetHeight(RESTING_HEIGHT);
    }
  }, [selectedBlockId, isDragging]);

  const { setNodeRef: setPanelRef, isOver: isPanelOver } = useDroppable({
    id: 'plan-panel',
    data: { type: 'plan-panel' },
  });

  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(RESTING_HEIGHT);

  const tripBlocks = planBlocks
    .filter((b) => b.tripId === currentTripId)
    .sort((a, b) => a.order - b.order);

  const scheduledBlockIds = new Set(
    calendarEvents
      .filter((e) => e.tripId === currentTripId)
      .map((e) => e.planBlockId)
  );

  const unscheduled = tripBlocks.filter((b) => !scheduledBlockIds.has(b.id));
  const scheduled = tripBlocks.filter((b) => scheduledBlockIds.has(b.id));

  function onTouchStart(e: React.TouchEvent) {
    isManualDragging.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragStartHeight.current = sheetHeight;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (dragStartY.current === null) return;
    e.preventDefault(); // prevent page scroll while dragging sheet
    const deltaY = dragStartY.current - e.touches[0].clientY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.min(EXPANDED_HEIGHT, Math.max(COLLAPSED_HEIGHT, dragStartHeight.current + deltaVh));
    setSheetHeight(newHeight);
  }

  function onTouchEnd() {
    isManualDragging.current = false;
    const distances = [
      { height: COLLAPSED_HEIGHT, dist: Math.abs(sheetHeight - COLLAPSED_HEIGHT) },
      { height: RESTING_HEIGHT, dist: Math.abs(sheetHeight - RESTING_HEIGHT) },
      { height: EXPANDED_HEIGHT, dist: Math.abs(sheetHeight - EXPANDED_HEIGHT) },
    ];
    const closest = distances.reduce((a, b) => (a.dist < b.dist ? a : b));
    setSheetHeight(closest.height);
    dragStartY.current = null;
  }

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">My Plans</span>
        {currentTripId && (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold leading-none hover:bg-indigo-700 transition-colors shadow-sm"
            title="Add plan"
          >
            +
          </button>
        )}
      </div>

      {/* Body */}
      <div
        ref={setPanelRef}
        className={`flex-1 overflow-y-auto px-3 py-3 space-y-4 transition-colors ${isPanelOver ? 'bg-green-50' : ''}`}
      >
        {!currentTripId ? (
          <p className="text-center text-gray-400 text-sm mt-6">Select a trip to see plans.</p>
        ) : tripBlocks.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-32 text-center border-2 border-dashed border-gray-200 rounded-xl mx-1 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
            onClick={() => setShowAddModal(true)}
          >
            <p className="text-gray-400 text-sm font-medium">계획을 추가해보세요 →</p>
            <p className="text-gray-300 text-xs mt-1">클릭하여 첫 번째 계획을 만드세요</p>
          </div>
        ) : (
          <>
            {unscheduled.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Unscheduled</p>
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    {unscheduled.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {unscheduled.map((block) => (
                    <PlanBlockCard key={block.id} block={block} isScheduled={false} />
                  ))}
                </div>
              </div>
            )}

            {scheduled.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Scheduled</p>
                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-400 px-1.5 py-0.5 rounded-full">
                    {scheduled.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {scheduled.map((block) => (
                    <PlanBlockCard key={block.id} block={block} isScheduled={true} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex flex-col w-[260px] h-full bg-white border-r border-gray-200 flex-shrink-0">
        {panelContent}
      </div>

      {/* Mobile: bottom sheet */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white rounded-t-2xl shadow-2xl flex flex-col"
        style={{
          height: `${sheetHeight}vh`,
          transition: isManualDragging.current ? 'none' : 'height 0.2s ease',
        }}
      >
        {/* Drag handle — touch target is intentionally tall */}
        <div
          className="flex justify-center pt-3 pb-2 flex-shrink-0 touch-none"
          style={{ minHeight: 44 }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-12 h-1.5 rounded-full bg-gray-300 mt-1" />
        </div>

        {sheetHeight > COLLAPSED_HEIGHT + 2 ? panelContent : (
          <div
            className="flex items-center justify-center flex-1 pb-2 touch-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <span className="text-xs text-gray-400">↑ 위로 올려서 계획 보기</span>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddPlanModal mode="add" onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}
