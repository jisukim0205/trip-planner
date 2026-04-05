import { useState } from 'react';
import { useTripStore } from '../../store/useTripStore';
import type { Trip } from '../../types';
import DateRangePicker from './DateRangePicker';

interface EditTripModalProps {
  trip: Trip;
  onClose: () => void;
}

export default function EditTripModal({ trip, onClose }: EditTripModalProps) {
  const { updateTrip } = useTripStore();

  const [title, setTitle] = useState(trip.title);
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [gridStartHour, setGridStartHour] = useState(trip.gridStartHour);
  const [gridEndHour, setGridEndHour] = useState(trip.gridEndHour);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!destination.trim()) errs.destination = 'Destination is required';
    if (!startDate) errs.startDate = 'Start date is required';
    if (!endDate) errs.endDate = 'End date is required';
    if (startDate && endDate && endDate < startDate) errs.endDate = 'End date must be on or after start date';
    if (gridStartHour < 0 || gridStartHour > 23) errs.gridStartHour = 'Must be 0–23';
    if (gridEndHour < 1 || gridEndHour > 24) errs.gridEndHour = 'Must be 1–24';
    if (gridEndHour <= gridStartHour) errs.gridEndHour = 'End hour must be after start hour';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // updateTrip in the store handles silent unscheduling of out-of-range events
    updateTrip(trip.id, {
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      gridStartHour,
      gridEndHour,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-5">Edit Trip</h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trip Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })); }}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => { setDestination(e.target.value); setErrors((p) => ({ ...p, destination: '' })); }}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.destination ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.destination && <p className="text-xs text-red-500 mt-1">{errors.destination}</p>}
          </div>

          {/* Dates */}
          <div>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
                setErrors((p) => ({ ...p, startDate: '', endDate: '' }));
              }}
            />
            {(errors.startDate || errors.endDate) && (
              <p className="text-xs text-red-500 mt-1">{errors.startDate || errors.endDate}</p>
            )}
          </div>

          {/* Grid hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grid Start Hour</label>
              <input
                type="number"
                min={0}
                max={23}
                value={gridStartHour}
                onChange={(e) => { setGridStartHour(Number(e.target.value)); setErrors((p) => ({ ...p, gridStartHour: '' })); }}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.gridStartHour ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.gridStartHour && <p className="text-xs text-red-500 mt-1">{errors.gridStartHour}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grid End Hour</label>
              <input
                type="number"
                min={1}
                max={24}
                value={gridEndHour}
                onChange={(e) => { setGridEndHour(Number(e.target.value)); setErrors((p) => ({ ...p, gridEndHour: '' })); }}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.gridEndHour ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.gridEndHour && <p className="text-xs text-red-500 mt-1">{errors.gridEndHour}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
