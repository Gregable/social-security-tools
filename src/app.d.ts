// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

declare namespace App {
  // interface Error {}
  // interface Locals {}
  // interface PageData {}
  // interface Platform {}
}

// Workaround for svelte-check duplicate export ambiguity involving
// FireFunction / FireObject re-exported by @testing-library/svelte.
// We provide an explicit ambient merge so the compiler treats these
// identifiers as already declared, silencing duplicate export noise.
declare module '@testing-library/svelte' {
  // Use globalThis types to avoid complaints if DOM lib resolution differs.
  export type FireFunction = (
    element:
      | typeof globalThis.document
      | typeof globalThis.Element
      | typeof globalThis.window
      | typeof globalThis.Node,
    event: Event
  ) => boolean;
  export type FireObject = {
    [k: string]: (
      element:
        | typeof globalThis.document
        | typeof globalThis.Element
        | typeof globalThis.window
        | typeof globalThis.Node,
      options?: Record<string, any>
    ) => boolean;
  };
}
