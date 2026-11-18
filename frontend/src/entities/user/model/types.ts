export interface Address {
  id: string;
  title: string;
  text: string;
  landmark?: string;
  pincode: string;
  isDefault: boolean;
}

export interface KhataTransaction {
  id: string;
  date: string;
  timestamp: number;
  desc: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceAfter: number;
  referenceOrder?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  addresses: Address[];
  khataBalance: number;
  khataCreditLimit: number;
  khataLedger: KhataTransaction[];
  /** Amount the customer currently owes the store (credits minus payments). */
  balanceDue: number;
}

/** Profile used while nobody is signed in. */
export const GUEST_PROFILE: UserProfile = {
  id: '',
  balanceDue: 0,
  name: 'Guest',
  phone: '',
  email: '',
  addresses: [],
  khataBalance: 0,
  khataCreditLimit: 10000,
  khataLedger: [],
};
