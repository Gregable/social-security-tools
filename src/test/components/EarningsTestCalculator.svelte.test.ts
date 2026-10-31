import posthog from 'posthog-js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GUIDE_WIDGET_USED } from '$lib/analytics/guide-widget';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

vi.mock('$app/stores', () => ({
  page: {
    subscribe(run: (value: { url: URL }) => void) {
      run({ url: new URL('https://ssa.tools/guides/earnings-test') });
      return () => {};
    },
  },
}));

const { default: EarningsTestCalculator } = await import(
  '../../routes/guides/earnings-test/EarningsTestCalculator.svelte'
);

type Props = {
  year?: number;
  period?: 'underFra' | 'fraYear';
  earnings?: number;
  monthlyBenefit?: number;
};

describe('EarningsTestCalculator', () => {
  const cleanups: (() => void)[] = [];

  beforeEach(() => {
    vi.mocked(posthog.capture).mockClear();
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  function render(props: Props = {}): HTMLElement {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(EarningsTestCalculator, { target, props });
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    flushSync();
    return target;
  }

  function input(target: HTMLElement, name: string): HTMLInputElement {
    const el = target.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (!el) throw new Error(`No input named ${name}`);
    return el;
  }

  function setNumber(el: HTMLInputElement, value: string): void {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
  }

  it("shows Sarah's figures with the guide's defaults", () => {
    const target = render({
      year: 2027,
      period: 'underFra',
      earnings: 35560,
      monthlyBenefit: 1500,
    });
    const results = target.querySelector('.widget-results')?.textContent ?? '';
    expect(results).toContain('$25,560');
    expect(results).toContain('$10,000');
    expect(results).toContain('$5,000');
    expect(results).toContain('4 checks');
    expect(results).toContain('May');
    expect(results).toContain('$1,000');
    expect(results).toContain('$13,000');
  });

  it('recomputes when earnings change', () => {
    const target = render({ year: 2027, period: 'underFra' });
    setNumber(input(target, 'earnings'), '20000');
    const results = target.querySelector('.widget-results')?.textContent ?? '';
    expect(results).toContain('under the limit');
    expect(results).not.toContain('checks');
  });

  it('switches to the one-for-three rule in the full retirement age year', () => {
    const target = render({
      year: 2027,
      earnings: 73000,
      monthlyBenefit: 2000,
    });
    const fraYear = target.querySelector<HTMLInputElement>(
      'input[type="radio"][value="fraYear"]'
    );
    if (!fraYear) throw new Error('No FRA-year radio');
    fraYear.click();
    flushSync();
    const results = target.querySelector('.widget-results')?.textContent ?? '';
    expect(results).toContain('$67,920');
    expect(results).toContain('$3');
    expect(results).toContain('$1,693');
    expect(results).toContain('1 check');
  });

  it('treats an emptied field as zero rather than breaking', () => {
    const target = render({ year: 2027 });
    setNumber(input(target, 'monthlyBenefit'), '');
    const results = target.querySelector('.widget-results')?.textContent ?? '';
    expect(results).toContain('$0');
  });

  it('reports one usage event per page view, without values', () => {
    const target = render({ year: 2027 });
    const earnings = input(target, 'earnings');
    setNumber(earnings, '40000');
    setNumber(earnings, '41000');
    setNumber(input(target, 'monthlyBenefit'), '1600');
    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith(GUIDE_WIDGET_USED, {
      widget: 'earnings-test',
      guide_slug: 'earnings-test',
    });
  });

  it('reports nothing until the reader changes something', () => {
    render({ year: 2027 });
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});
