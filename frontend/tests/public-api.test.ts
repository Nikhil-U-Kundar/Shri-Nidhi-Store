import { describe, expect, it } from 'vitest';

// Covers the files with no behaviour of their own: every index.ts barrel must load and export something.
const barrels = import.meta.glob('../src/**/index.ts');

describe('public APIs', () => {
  it.each(Object.keys(barrels))('%s exports something', async (path) => {
    const exports = (await barrels[path]()) as Record<string, unknown>;
    expect(Object.keys(exports).length).toBeGreaterThan(0);
  });
});
