import { getToken } from './session';

const REQUEST_TIMEOUT_MS = 25_000;
const API_BASE = import.meta.env.VITE_API_URL || '';

/** JSON request helper for the Sri Nidhi API. Throws an Error with a user-facing message on failure. */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Server took too long. Database may be unreachable.');
    }
    throw new Error('Cannot reach the server. Check that the API and database are running.');
  } finally {
    clearTimeout(timer);
  }

  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || 'Request failed');
  }
  return data as T;
}
