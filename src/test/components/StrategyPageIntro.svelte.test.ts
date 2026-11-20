import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StrategyPage from '../../routes/strategy/+page.svelte';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
// The discount rate field looks up the Treasury yield when it mounts. Keep
// the test off the network.
vi.mock('$lib/strategy/data', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/strategy/data')>()),
  getRecommendedDiscountRate: async () => 0.025,
}));

/** A little longer than the page's 320ms slide between stages. */
const TRANSITION_MS = 400;

/**
 * The picker and the form slide in and out. Waiting for a slide to end
 * means an element that is leaving is gone before the next assertion, and
 * nothing is still animating when the page is unmounted.
 */
async function transitionsEnd(): Promise<void> {
  flushSync();
  await new Promise((resolve) => setTimeout(resolve, TRANSITION_MS));
  flushSync();
}

/**
 * The intro under the mode picker explains the tool to someone who has not
 * used it yet. It goes away when a mode is picked and does not come back
 * during the visit, even when Start over returns to the picker.
 */
describe('/strategy intro visibility', () => {
  let cleanup: (() => void) | null = null;

  afterEach(async () => {
    await transitionsEnd();
    cleanup?.();
    cleanup = null;
  });

  function mountPage(): HTMLElement {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(StrategyPage, { target });
    cleanup = () => {
      unmount(component);
      target.remove();
    };
    flushSync();
    return target;
  }

  async function clickButton(page: HTMLElement, label: string): Promise<void> {
    const button = [...page.querySelectorAll('button')].find((candidate) =>
      candidate.textContent?.includes(label)
    );
    if (!button) throw new Error(`no button labelled "${label}"`);
    button.click();
    await transitionsEnd();
  }

  const intro = (page: HTMLElement) => page.querySelector('section.intro');
  const picker = (page: HTMLElement) => page.querySelector('.mode-picker');

  it('shows the intro under the picker on arrival', () => {
    const page = mountPage();
    expect(picker(page)).not.toBeNull();
    expect(intro(page)).not.toBeNull();
  });

  it('hides the intro once a mode is picked', async () => {
    const page = mountPage();
    await clickButton(page, 'Just me');
    expect(picker(page)).toBeNull();
    expect(page.textContent).toContain('Tell us about you');
    expect(intro(page)).toBeNull();
  });

  it('keeps the intro hidden when Start over brings the picker back', async () => {
    const page = mountPage();
    await clickButton(page, 'Just me');
    await clickButton(page, 'Start over');
    expect(picker(page)).not.toBeNull();
    expect(intro(page)).toBeNull();
  });
});
