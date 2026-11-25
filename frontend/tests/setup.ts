import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { mockApi } from './helpers';

// Canvas is not available in jsdom.
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn() as never;
  Element.prototype.scrollIntoView = vi.fn();
  // No test may reach a real server.
  mockApi();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
