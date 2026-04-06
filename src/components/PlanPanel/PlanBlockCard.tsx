import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useTripStore } from '../../store/useTripStore';
import type { PlanBlock } from '../../types';
import { COLOR_MAP, COLOR_HEX } from '../../utils/colors';
import AddPlanModal from '../Modals/AddPlanModal';
import { useDndApp } from '../../context/DndAppContext';

interface PlanBlockCardProps {
  block: PlanBlock;
  isScheduled: boolean;
}

interface DetailPopoverProps {
  block: PlanBlock;
  onClose: () => void;
}

function DetailPopover({ block, onClose }: DetailPopoverProps) {
  const { unscheduleBlock } = useTripStore();
  const colors = COLOR_MAP[block.color];

  function handleUnschedule() {
    unscheduleBlock(block.id);
    onClose();
  }

  return (
    <div className="absolute left-0 bottom-full mb-2 z-50 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-4">
      <div className="flex items-start gap-2 mb-2">
        <span
          className="mt-0.5 w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: COLOR_HEX[block.color] }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 leading-tight">{block.title}</p>
          {block.description && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{block.description}</p>
          )}
        </div>
      </div>
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${colors.bg} ${colors.text}`}>
        {block.duration}h
      </div>
      <button
        onClick={handleUnschedule}
        className="w-full px-3 py-1.5 rounded-lg border border-red-300 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
      >
        Remove from calendar
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-sm leading-none p-1"
      >
        ✕
      </button>
    </div>
  );
}

export default function PlanBlockCard({ block, isScheduled }: PlanBlockCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  const { deletePlanBlock, unscheduleBlock } = useTripStore();
  const { selectedBlockId, setSelectedBlockId, isMobile } = useDndApp();
  const isSelected = selectedBlockId === block.id;

  const colors = COLOR_MAP[block.color];

  // Draggable: disable on mobile (use tap flow) and for scheduled non-repeatable blocks
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `plan-block-${block.id}`,
    data: { type: 'plan-block', blockId: block.id },
    disabled: isMobile,
  });

  function handleClick() {
    if (isMobile) {
      // Mobile tap flow: select block to place
      if (selectedBlockId === block.id) {
        setSelectedBlockId(null); // deselect
      } else {
        setSelectedBlockId(block.id);
      }
      return;
    }

    setShowEdit(true);
  }

  return (
    <>
      <div
        ref={setNodeRef}
        data-plan-id={block.id}
        className={`group relative flex items-start gap-2 p-3 rounded-xl border-l-4 ${colors.bg} ${colors.border} select-none transition-shadow ${
          isDragging ? 'opacity-0' : ''
        } ${
          isSelected
            ? 'ring-2 ring-indigo-500 ring-offset-1'
            : ''
        } ${
          isScheduled && !isMobile
            ? 'cursor-pointer opacity-75 hover:shadow-md'
            : 'cursor-grab active:cursor-grabbing hover:shadow-md'
        }`}
        onClick={handleClick}
        {...(isMobile ? {} : { ...attributes, ...listeners })}
      >
        {/* Drag handle (desktop only) */}
        {!isMobile && (
          <span className="text-gray-400 text-sm leading-none mt-0.5 flex-shrink-0" title="Drag to reorder">
            ⠿
          </span>
        )}

        {/* Mobile: tap-to-select indicator */}
        {isMobile && (
          <span className={`text-sm leading-none mt-0.5 flex-shrink-0 ${isSelected ? 'text-indigo-500' : 'text-gray-400'}`}>
            {isSelected ? '✓' : '⊕'}
          </span>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[13px] font-bold text-gray-800 truncate leading-tight">{block.title}</p>
            {block.repeatable && (
              <span className="text-[10px]" title="Repeatable">🔁</span>
            )}
          </div>
          {block.description && (
            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{block.description}</p>
          )}
          <div className="mt-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/80 text-[11px] font-medium text-gray-700 shadow-sm">
              {block.duration}h
            </span>
          </div>
        </div>

        {/* × delete button — always visible on mobile, hover-only on desktop */}
        <button
          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[13px] font-bold text-gray-400 hover:bg-black/10 hover:text-gray-600 transition-opacity ${
            isMobile ? 'opacity-60' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => { e.stopPropagation(); isScheduled ? unscheduleBlock(block.id) : deletePlanBlock(block.id); }}
          onPointerDown={(e) => e.stopPropagation()}
          title={isScheduled ? 'Remove from calendar' : 'Delete plan'}
        >
          ×
        </button>

        {/* Scheduled popover */}
        {showPopover && isScheduled && (
          <DetailPopover block={block} onClose={() => setShowPopover(false)} />
        )}
      </div>

      {showEdit && (
        <AddPlanModal mode="edit" block={block} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
}
