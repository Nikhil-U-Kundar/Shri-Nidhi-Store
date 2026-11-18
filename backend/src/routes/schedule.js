import { Router } from 'express';
import { getScheduleSettings, getActiveSlots, bookableSlotsFor, earliestBookableDate, storeDate } from '../services/schedule.js';

const router = Router();

/** Booking rules and the slot catalogue shown on the checkout page. Public. */
router.get('/schedule', async (_req, res) => {
  try {
    const [settings, slots] = await Promise.all([getScheduleSettings(), getActiveSlots()]);
    const now = new Date();
    res.json({
      advanceHours: Number(settings.advance_booking_hours),
      sameDayDelivery: settings.same_day_delivery === true,
      deliveryFee: Number(settings.delivery_fee),
      freeDeliveryThreshold: Number(settings.free_delivery_threshold),
      today: storeDate(now),
      earliestDate: earliestBookableDate(slots, settings, now),
      slots,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/** Slots still bookable on one date. */
router.get('/schedule/slots', async (req, res) => {
  const date = String(req.query.date || '');
  try {
    const [settings, slots] = await Promise.all([getScheduleSettings(), getActiveSlots()]);
    res.json({ date, slots: bookableSlotsFor(date, slots, settings, new Date()) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
