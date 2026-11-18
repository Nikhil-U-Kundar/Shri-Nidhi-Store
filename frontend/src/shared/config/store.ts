/** Store identity and commercial rules shared across the storefront and admin console. */
export const STORE = {
  name: 'Sri Nidhi Store',
  legalName: 'SRI NIDHI STORE & GENERAL STORE',
  phoneDisplay: '8970128830',
  phoneTel: '+918970128830',
  email: 'support@srinidhistore.local',
  address: 'Belapu, industrial Area, Haryana - 122001',
  /** Opening hours, shown in the header and footer. */
  hours: '5:30 AM – 11:00 PM',
  fssai: '10012031000085',
  pincode: '122001',
  /** Short address printed on bills and receipts. */
  billAddress: 'Belapu, industrial Area',
} as const;

export const DELIVERY = {
  freeThreshold: 499,
  fee: 40,
} as const;

/** Stock at or below this count is flagged as low. */
export const LOW_STOCK_THRESHOLD = 5;
