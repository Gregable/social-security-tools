// @ts-nocheck
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

// Ensure Svelte component trees are torn down between tests to prevent cross-test interference.
afterEach(() => cleanup());
// Additional global test setup (if needed later)
