import { useEffect, useState } from 'react';
import { scheduleApi, type DeliverySlot, type ScheduleInfo } from '@/entities/schedule';
import { errorMessage } from '@/shared/lib/errors';

interface SchedulePickerProps {
  date: string;
  slotId: string;
  onChange: (next: { date: string; slotId: string }) => void;
}

/** Choose a delivery date (at least the store's advance-booking window away) and a slot still open that day. */
export function SchedulePicker({ date, slotId, onChange }: SchedulePickerProps) {
  const [info, setInfo] = useState<ScheduleInfo | null>(null);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [loadError, setLoadError] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    scheduleApi
      .get()
      .then(setInfo)
      .catch((err: unknown) => setLoadError(errorMessage(err, 'Could not load delivery dates')));
  }, []);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      return;
    }
    let active = true;
    setSlotsLoading(true);
    scheduleApi
      .slotsFor(date)
      .then((list) => active && setSlots(list))
      .catch(() => active && setSlots([]))
      .finally(() => active && setSlotsLoading(false));
    return () => {
      active = false;
    };
  }, [date]);

  if (loadError) {
    return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{loadError}</p>;
  }
  if (!info) {
    return <p className="text-xs text-stone-500">Loading delivery dates…</p>;
  }

  const handleDate = (next: string) => {
    onChange({ date: next, slotId: '' });
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="delivery-date" className="mb-1 block text-xs font-semibold text-stone-700">
          Delivery date
        </label>
        <input
          id="delivery-date"
          type="date"
          min={info.earliestDate ?? undefined}
          value={date}
          onChange={(e) => handleDate(e.target.value)}
          className="w-full rounded-xl border border-stone-200 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-stone-500">
          Orders need {info.advanceHours} hours&apos; notice
          {info.sameDayDelivery ? '' : '; same-day delivery is not available'}. Earliest date:{' '}
          <strong className="text-stone-700">{info.earliestDate ?? 'not available right now'}</strong>
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs font-semibold text-stone-700">Time slot</legend>
        {!date && <p className="text-[11px] text-stone-500">Choose a date to see open slots.</p>}
        {date && slotsLoading && <p className="text-[11px] text-stone-500">Checking open slots…</p>}
        {date && !slotsLoading && slots.length === 0 && (
          <p className="text-[11px] text-amber-700">No slots are open on this date. Pick another day.</p>
        )}
        {slots.map((slot) => (
          <label
            key={slot.id}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-xs transition ${
              slotId === slot.id ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <input
              type="radio"
              name="delivery-slot"
              value={slot.id}
              checked={slotId === slot.id}
              onChange={() => onChange({ date, slotId: slot.id })}
              className="accent-emerald-600"
            />
            <span className="font-semibold text-stone-900">{slot.label}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
