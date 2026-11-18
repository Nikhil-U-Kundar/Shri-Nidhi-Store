import type { UserProfile } from '../model/types';
import type { ApiUser } from '../api/userApi';

const DEFAULT_KHATA_LIMIT = 10000;

/** Convert the API user record into the storefront's profile shape. */
export function toUserProfile(u: ApiUser): UserProfile {
  return {
    name: u.name || '',
    phone: u.phone || '',
    email: u.email || '',
    addresses: u.addresses || [],
    khataBalance: Number(u.khataBalance) || 0,
    khataCreditLimit: Number(u.khataCreditLimit) || DEFAULT_KHATA_LIMIT,
    khataLedger: u.khataLedger || [],
  };
}
