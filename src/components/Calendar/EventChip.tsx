import { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { CalendarEvent, PlanBlock } from '../../types';
import { COLOR_MAP, COLOR_HEX } from '../../utils/colors';
import { useTripStore } from '../../store/useTripStore';
import { useDndApp } from '../../context/DndAppContext';

interface EventChipProps {
  event: CalendarEvent;
  block: PlanBlock;
  style?: React.CSSProperties;
  isContinuation?: boolean;
  continuationHours?: number;
}

const ROW_HEIGHT = 56; // px per hour — must match WeekView/DayView

function formatDuration(hours: number): string {
  if (hours === Math.floor(hours)) return `${hours}h`;
  return `${hours}h`;
}

export default function EventChip({ event, block, style, isContinuation, continuationHours }: EventChipProps) {
  const [showPopup, setShowPopup] = useState(false);
  const { deleteCalendarEvent, updateCalendarEvent } = useTripStore();
  const { isMobile } = useDndApp();

  const colorMap = COLOR_MAP[block.color];
  const colorHex = COLOR_HEX[block.color];

  const displayDuration = isContinuation && continuationHours != null
    ? continuationHours
    : event.duration;

  // --- Drag to move ---
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `calendar-event-${event.id}`,
    data: { type: 'calendar-event', eventId: event.id, blockId: event.planBlockId },
    disabled: !!isContinuation, // continuation chips are not independently draggable
  });

  // --- Resize by dragging bottom edge ---
  const resizing = useRef(false);
  const resizeStartY = useRef(0);
  const resizeStartDuration = useRef(event.duration);
  const [localDuration, setLocalDuration] = useState(event.duration);

  // Sync localDuration when event.duration changes from outside (e.g. store update)
  useEffect(() => {
    setLocalDuration(event.duration);
  }, [event.duration]);

  function handleResizePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    resizing.current = true;
    resizeStartY.current = e.clientY;
    resizeStartDuration.current = event.duration;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      if (!resizing.current) return;
      const deltaY = e.clientY - resizeStartY.current;
      const deltaHours = deltaY / ROW_HEIGHT;
      const raw = resizeStartDuration.current + deltaHours;
      const snapped = Math.max(0.5, Math.round(raw * 2) / 2);
      setLocalDuration(snapped);
    }

    function onPointerUp() {
      if (!resizing.current) return;
      resizing.current = false;
      updateCalendarEvent(event.id, { duration: localDuration });
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [event.id, localDuration, updateCalendarEvent]);

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    deleteCalendarEvent(event.id);
    setShowPopup(false);
  }

  // Merge the passed style with drag transform; also apply live resize height
  const chipStyle: React.CSSProperties = {
    borderLeft: `3px solid ${colorHex}`,
    padding: '4px 8px',
    fontSize: '12px',
    zIndex: isDragging ? 50 : 10,
    ...style,
    height: resizing.current ? localDuration * ROW_HEIGHT - 2 : style?.height,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className={`absolute rounded-lg overflow-visible select-none group ${colorMap.bg} ${colorMap.text} ${
          isDragging ? 'opacity-0 cursor-grabbing' : isContinuation ? 'cursor-default' : 'cursor-grab'
        }`}
        style={chipStyle}
        onClick={() => !isDragging && setShowPopup(true)}
        data-event-id={event.id}
        data-plan-block-id={event.planBlockId}
        {...(isContinuation ? {} : { ...attributes, ...listeners })}
      >
        {/* × unschedule button — always visible on mobile, hover-only on desktop */}
        {!isContinuation && (
          <button
            className={`absolute top-0.5 right-0.5 rounded-full bg-black/0 hover:bg-black/20 text-current transition-opacity flex items-center justify-center font-bold leading-none z-10 ${
              isMobile
                ? 'w-6 h-6 text-sm opacity-80'
                : 'w-4 h-4 text-[11px] opacity-0 group-hover:opacity-100'
            }`}
            onClick={(e) => { e.stopPropagation(); deleteCalendarEvent(event.id); }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Remove from calendar"
          >
            ×
          </button>
        )}

        <div className="font-semibold truncate leading-tight pr-3">
          {isContinuation && <span className="mr-1 opacity-60">↩</span>}
          {block.title}
        </div>
        <div className="opacity-70 text-[10px] leading-tight">
          {formatDuration(displayDuration)}
        </div>

        {/* Resize handle at the bottom — only for non-continuation chips */}
        {!isContinuation && (
          <div
            className={`absolute bottom-0 left-0 right-0 cursor-ns-resize flex items-center justify-center ${isMobile ? 'h-5' : 'h-2'}`}
            onPointerDown={handleResizePointerDown}
            onClick={(e) => e.stopPropagation()}
            title="Drag to resize"
          >
            <div className="w-6 h-0.5 rounded-full bg-current opacity-40" />
          </div>
        )}
      </div>

      {showPopup && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-5 w-72 max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Color dot + title */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: colorHex }}
                />
                <h3 className="font-bold text-gray-800 text-base leading-snug">
                  {block.title}
                </h3>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600 ml-2 text-lg leading-none"
                onClick={() => setShowPopup(false)}
              >
                ×
              </button>
            </div>

            {block.description && (
              <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                {block.description}
              </p>
            )}

            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-400 text-xs">Duration:</span>
              <span className="font-semibold text-sm text-gray-700">
                {formatDuration(event.duration)}
              </span>
            </div>

            <button
              className="w-full py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              onClick={handleDelete}
            >
              × Remove from calendar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
