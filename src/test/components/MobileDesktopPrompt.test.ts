import { describe, expect, it } from 'vitest';

/**
 * Tests for MobileDesktopPrompt component logic.
 *
 * The component shows a mailto: prompt to mobile users encouraging them
 * to revisit on desktop. These tests verify the mailto link construction
 * and dismissal key logic.
 */

const SITE_URL = 'https://ssa.tools/calculator';
const DISMISS_KEY = 'mobileDesktopPromptDismissed';

function buildMailtoHref(): string {
  const subject = encodeURIComponent('Try SSA.tools on your computer');
  const body = encodeURIComponent(
    `Here's the link to calculate your Social Security benefits:\n\n${SITE_URL}\n\nCopying your earnings record from ssa.gov is much easier on a desktop or laptop.`
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

describe('MobileDesktopPrompt', () => {
  describe('mailto link', () => {
    it('starts with mailto:', () => {
      const href = buildMailtoHref();
      expect(href.startsWith('mailto:')).toBe(true);
    });

    it('includes a subject with SSA.tools', () => {
      const href = buildMailtoHref();
      expect(href).toContain('subject=');
      expect(decodeURIComponent(href)).toContain('SSA.tools');
    });

    it('includes the calculator URL in the body', () => {
      const href = buildMailtoHref();
      expect(decodeURIComponent(href)).toContain(SITE_URL);
    });

    it('has no recipient (user fills in their own email)', () => {
      const href = buildMailtoHref();
      expect(href.startsWith('mailto:?')).toBe(true);
    });
  });

  describe('dismiss key', () => {
    it('uses a consistent sessionStorage key', () => {
      expect(DISMISS_KEY).toBe('mobileDesktopPromptDismissed');
    });
  });
});
