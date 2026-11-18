const TOKEN_KEY = 'sns_token';
const USER_KEY = 'sns_user';

export interface StoredSessionUser {
  name?: string;
  role?: 'customer' | 'admin';
}

/** localStorage can throw in private windows or with blocked site data; treat that as "no session". */
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return readStorage(TOKEN_KEY);
}

export function getStoredUser(): StoredSessionUser | null {
  const raw = readStorage(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSessionUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: StoredSessionUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable: the session lasts for this page view only */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* nothing to clear */
  }
}
