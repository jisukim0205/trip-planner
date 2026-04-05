import { useState } from 'react';
import { useTripStore } from '../../store/useTripStore';
import type { PlanBlock, PlanColor, PlanLocation } from '../../types';
import { COLOR_HEX } from '../../utils/colors';
import LocationSearch from './LocationSearch';

interface AddPlanModalProps {
  mode: 'add' | 'edit';
  block?: PlanBlock;
  onClose: () => void;
}

const COLORS: PlanColor[] = ['coral', 'sky', 'sage', 'amber', 'violet'];

export default function AddPlanModal({ mode, block, onClose }: AddPlanModalProps) {
  const { addPlanBlock, updatePlanBlock, deletePlanBlock, planBlocks, currentTripId } = useTripStore();

  const [title, setTitle] = useState(block?.title ?? '');
  const [description, setDescription] = useState(block?.description ?? '');
  const [duration, setDuration] = useState<number>(block?.duration ?? 1);
  const [color, setColor] = useState<PlanColor>(block?.color ?? 'coral');
  const [repeatable, setRepeatable] = useState(block?.repeatable ?? false);
  const [location, setLocation] = useState<PlanLocation | undefined>(block?.location);
  const [titleError, setTitleError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }

    if (mode === 'add') {
      const tripBlocks = planBlocks.filter((b) => b.tripId === currentTripId);
      const newBlock: PlanBlock = {
        id: crypto.randomUUID(),
        tripId: currentTripId!,
        title: title.trim(),
        description: description.trim(),
        duration,
        color,
        repeatable,
        location,
        order: tripBlocks.length,
      };
      addPlanBlock(newBlock);
    } else if (mode === 'edit' && block) {
      updatePlanBlock(block.id, {
        title: title.trim(),
        description: description.trim(),
        duration,
        color,
        repeatable,
        location,
      });
    }
    onClose();
  }

  function handleDelete() {
    if (block) {
      deletePlanBlock(block.id);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-5">
          {mode === 'add' ? 'Add Plan' : 'Edit Plan'}
        </h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTitleError(''); }}
              placeholder="e.g. Visit Shibuya Crossing"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${titleError ? 'border-red-400' : 'border-gray-300'}`}
            />
            {titleError && <p className="text-xs text-red-500 mt-1">{titleError}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="Short note about this plan..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-0.5">{description.length}/200</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Location
            </label>
            <LocationSearch value={location} onChange={setLocation} />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={duration}
              onChange={(e) => setDuration(Math.max(0.5, Number(e.target.value)))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Color swatches */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: COLOR_HEX[c],
                    outline: color === c ? `3px solid #4f46e5` : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Repeatable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Repeatable</p>
              <p className="text-xs text-gray-400">Stays in panel after placement</p>
            </div>
            <button
              type="button"
              onClick={() => setRepeatable((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${repeatable ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${repeatable ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {mode === 'add' ? 'Add Plan' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
