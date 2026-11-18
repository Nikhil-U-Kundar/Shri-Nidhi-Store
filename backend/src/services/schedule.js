import { query } from '../db/store.js';

/**
 * Pre-order scheduling. Store-local time is India Standard Time (UTC+05:30,
 * no daylight saving), so all booking cut-offs are computed with that offset.
 */
const STORE_TZ = 'Asia/Kolkata';
const IST_OFFSET = '+05:30';
const MAX_LOOKAHEAD_DAYS = 30;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DEFAULTS = {
  advance_booking_hours: 24,
  same_day_delivery: false,
  delivery_fee: 40,
  free_delivery_threshold: 499,
};

export async function getScheduleSettings(run = query) {
  const result = await run(`SELECT key, value FROM store_settings`);
  const stored = Object.fromEntries(result.rows.map((r) => [r.key, r.value]));
  return { ...DEFAULTS, ...stored };
}

export async function getActiveSlots(run = query) {
  const result = await run(
    `SELECT id, label, to_char(start_time, 'HH24:MI') AS start_hm,
            to_char(end_time, 'HH24:MI') AS end_hm
     FROM delivery_slots WHERE is_active ORDER BY sort_order, start_time`
  );
  return result.rows.map((r) => ({ id: r.id, label: r.label, start: r.start_hm, end: r.end_hm }));
}

/** Calendar date (YYYY-MM-DD) of an instant, as seen in the store's timezone. */
export function storeDate(instant = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STORE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

function slotStartInstant(date, startHm) {
  return new Date(`${date}T${startHm}:00${IST_OFFSET}`);
}

function isValidDateString(value) {
  if (!DATE_PATTERN.test(String(value || ''))) return false;
  const d = new Date(`${value}T00:00:00${IST_OFFSET}`);
  return !Number.isNaN(d.getTime()) && storeDate(d) === value;
}

/** Whether a given slot on a given date can still be booked at `now`. */
function isBookable(date, slot, settings, now) {
  if (!settings.same_day_delivery && date <= storeDate(now)) return false;
  const earliest = now.getTime() + Number(settings.advance_booking_hours) * 3600 * 1000;
  return slotStartInstant(date, slot.start).getTime() >= earliest;
}

export function bookableSlotsFor(date, slots, settings, now = new Date()) {
  return slots.filter((slot) => isBookable(date, slot, settings, now));
}

/** Earliest date (YYYY-MM-DD) with at least one bookable slot, or null within the lookahead window. */
export function earliestBookableDate(slots, settings, now = new Date()) {
  const start = new Date(`${storeDate(now)}T00:00:00${IST_OFFSET}`);
  for (let day = 0; day <= MAX_LOOKAHEAD_DAYS; day += 1) {
    const candidate = storeDate(new Date(start.getTime() + day * 86400000));
    if (bookableSlotsFor(candidate, slots, settings, now).length) return candidate;
  }
  return null;
}

/**
 * Validate a requested delivery date and slot. Returns { ok: true, date, slot }
 * or { ok: false, message }. Never trusts client-side availability.
 */
export async function resolveSchedule({ deliveryDate, slotId }, run = query, now = new Date()) {
  if (!isValidDateString(deliveryDate)) {
    return { ok: false, message: 'Choose a valid delivery date (YYYY-MM-DD)' };
  }
  const [settings, slots] = await Promise.all([getScheduleSettings(run), getActiveSlots(run)]);
  const slot = slots.find((s) => s.id === slotId);
  if (!slot) return { ok: false, message: 'Choose an available delivery time slot' };
  if (!isBookable(deliveryDate, slot, settings, now)) {
    const hours = Number(settings.advance_booking_hours);
    return {
      ok: false,
      message: `This slot cannot be booked. Orders need at least ${hours} hours' notice${
        settings.same_day_delivery ? '' : ' and same-day delivery is not available'
      }.`,
    };
  }
  return { ok: true, date: deliveryDate, slot, settings };
}
