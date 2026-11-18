/** Store identity and commercial rules shared across the storefront and admin console. */
export const STORE = {
  name: 'Sri Nidhi Store',
  legalName: 'SRI NIDHI STORE & GENERAL STORE',
  phoneDisplay: '+91 98765 43210',
  phoneTel: '+919876543210',
  email: 'support@srinidhistore.local',
  address: 'Shop 12, Main Market, Belapu, industrial Area, Haryana - 122001',
  gstin: '06AABCU9603R1ZM',
  fssai: '10012031000085',
  pincode: '122001',
} as const;

export const DELIVERY = {
  freeThreshold: 499,
  fee: 40,
} as const;

/** Stock at or below this count is flagged as low. */
export const LOW_STOCK_THRESHOLD = 5;
