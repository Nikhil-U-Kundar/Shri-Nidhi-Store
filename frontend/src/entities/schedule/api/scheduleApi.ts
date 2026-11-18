import { apiRequest } from '@/shared/api/client';

export interface DeliverySlot {
  id: string;
  label: string;
  start: string;
  end: string;
}

/** Booking rules published by the server. The server is the source of truth for every check. */
export interface ScheduleInfo {
  advanceHours: number;
  sameDayDelivery: boolean;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  today: string;
  earliestDate: string | null;
  slots: DeliverySlot[];
}

export const scheduleApi = {
  get(): Promise<ScheduleInfo> {
    return apiRequest<ScheduleInfo>('/schedule');
  },

  async slotsFor(date: string): Promise<DeliverySlot[]> {
    const data = await apiRequest<{ slots: DeliverySlot[] }>(`/schedule/slots?date=${encodeURIComponent(date)}`);
    return data.slots;
  },
};
