/**
 * Utility to temporarily silence console.error / console.warn output that is
 * expected in negative-path tests (e.g. network failures) so test output stays clean.
 *
 * It captures the silenced messages so tests can still assert they occurred.
 *
 * Usage:
 *   const silencer = silenceConsole({
 *     error: [/Error fetching Treasury yield data/, /FRED network error/],
 *     warn: [/Using fallback due to Treasury data error/]
 *   });
 *   // ... run test code that triggers warnings/errors ...
 *   expect(silencer.getErrors()).not.toHaveLength(0);
 *   silencer.restore();
 *
 * If you omit patterns for a level, all messages for that level are silenced.
 */
import { vi } from 'vitest';

export interface SilencePatterns {
  error?: (RegExp | string)[];
  warn?: (RegExp | string)[];
}

export interface ConsoleSilencer {
  restore(): void;
  getErrors(): string[];
  getWarnings(): string[];
}

function matches(message: string, patterns?: (RegExp | string)[]): boolean {
  if (!patterns || patterns.length === 0) return true; // silence everything if no patterns provided
  return patterns.some((p) =>
    typeof p === 'string' ? message.includes(p) : p.test(message)
  );
}

export function silenceConsole(patterns: SilencePatterns): ConsoleSilencer {
  const errorMessages: string[] = [];
  const warnMessages: string[] = [];

  const originalError = console.error;
  const originalWarn = console.warn;

  const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
    const msg = args.map(String).join(' ');
    if (matches(msg, patterns.error)) {
      errorMessages.push(msg);
      return; // swallow
    }
    // fall through to original for messages we don't intend to silence
    originalError.apply(console, args as any);
  });

  const warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args) => {
    const msg = args.map(String).join(' ');
    if (matches(msg, patterns.warn)) {
      warnMessages.push(msg);
      return; // swallow
    }
    originalWarn.apply(console, args as any);
  });

  return {
    restore() {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    },
    getErrors() {
      return [...errorMessages];
    },
    getWarnings() {
      return [...warnMessages];
    },
  };
}
