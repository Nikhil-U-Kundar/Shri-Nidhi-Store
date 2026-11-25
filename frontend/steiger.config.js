import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Off on purpose: it asks to merge any slice used in only one place into its caller.
    // These components stay as separate slices so they can be reused.
    rules: { 'fsd/insignificant-slice': 'off' },
  },
]);
