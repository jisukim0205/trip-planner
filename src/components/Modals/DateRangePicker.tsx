import { useState } from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m: m - 1, d };
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(() => {
    if (startDate) return parseISO(startDate).y;
    return today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (startDate) return parseISO(startDate).m;
    return today.getMonth();
  });
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  // 'start' = next click sets start; 'end' = next click sets end
  const [step, setStep] = useState<'start' | 'end'>(startDate ? 'end' : 'start');

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleDayClick(iso: string) {
    if (step === 'start') {
      onChange(iso, '');
      setStep('end');
    } else {
      if (iso < startDate) {
        // Clicked before start → reset, make this the new start
        onChange(iso, '');
        setStep('end');
      } else {
        onChange(startDate, iso);
        setStep('start');
        setHoverDate(null);
      }
    }
  }

  function isInRange(iso: string): boolean {
    if (!startDate) return false;
    const end = step === 'end' && hoverDate ? hoverDate : endDate;
    if (!end) return false;
    return iso > startDate && iso < end;
  }

  function isStart(iso: string) { return iso === startDate; }
  function isEnd(iso: string) {
    const end = step === 'end' && hoverDate ? hoverDate : endDate;
    return iso === end && !!startDate;
  }

  // Build calendar grid cells
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toISO(viewYear, viewMonth, d));
  }
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });

  function formatDisplay(iso: string) {
    if (!iso) return '—';
    const { y, m, d } = parseISO(iso);
    return new Date(y, m, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Date Range <span className="text-red-500">*</span>
      </label>

      {/* Selected range display */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`flex-1 px-3 py-1.5 rounded-lg border text-center font-medium transition-colors ${
          step === 'start' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-gray-50 text-gray-700'
        }`}>
          {startDate ? formatDisplay(startDate) : <span className="text-gray-400">Start date</span>}
        </div>
        <span className="text-gray-400">→</span>
        <div className={`flex-1 px-3 py-1.5 rounded-lg border text-center font-medium transition-colors ${
          step === 'end' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-gray-50 text-gray-700'
        }`}>
          {endDate ? formatDisplay(endDate) : <span className="text-gray-400">End date</span>}
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-indigo-500 font-medium">
        {step === 'start' ? '📅 Select a start date' : '📅 Now select an end date'}
      </p>

      {/* Calendar */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
          <button
            type="button"
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-gray-700">{monthLabel}</span>
          <button
            type="button"
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="text-center text-[11px] font-semibold text-gray-400 py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 p-1 gap-y-0.5">
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} />;

            const start = isStart(iso);
            const end = isEnd(iso);
            const inRange = isInRange(iso);
            const isToday = iso === todayISO;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => handleDayClick(iso)}
                onMouseEnter={() => step === 'end' && setHoverDate(iso)}
                onMouseLeave={() => step === 'end' && setHoverDate(null)}
                className={`
                  relative h-8 w-full text-[12px] font-medium transition-colors rounded-lg
                  ${start || end
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : inRange
                    ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 rounded-none'
                    : isToday
                    ? 'text-indigo-600 font-bold hover:bg-indigo-50'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {new Date(iso + 'T00:00:00').getDate()}
                {isToday && !start && !end && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
