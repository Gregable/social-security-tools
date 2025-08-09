// Shim to avoid duplicate re-export ambiguity for FireFunction / FireObject.
// We explicitly import the types from @testing-library/dom and re-export them
// so that when @testing-library/svelte re-exports * the compiler sees a single
// canonical definition.

import type { FireFunction, FireObject } from '@testing-library/dom';

declare module '@testing-library/svelte' {
  // Re-export the DOM versions (no runtime impact; type-only augmentation)
  export { FireFunction, FireObject };
}
