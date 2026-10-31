import posthog from 'posthog-js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GUIDE_WIDGET_USED } from '$lib/analytics/guide-widget';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

vi.mock('$app/stores', () => ({
  page: {
    subscribe(run: (value: { url: URL }) => void) {
      run({ url: new URL('https://ssa.tools/guides/federal-taxes') });
      return () => {};
    },
  },
}));

const { default: TaxableBenefitsCalculator } = await import(
  '../../routes/guides/federal-taxes/TaxableBenefitsCalculator.svelte'
);

type Props = {
  status?: 'single' | 'joint';
  agi?: number;
  taxExemptInterest?: number;
  benefits?: number;
};

describe('TaxableBenefitsCalculator', () => {
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
    const component = mount(TaxableBenefitsCalculator, { target, props });
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    flushSync();
    return target;
  }

  function input(target: HTMLElement, label: string): HTMLInputElement {
    const el = target.querySelector<HTMLInputElement>(
      `[aria-label="${label}"]`
    );
    if (!el) throw new Error(`No input labelled ${label}`);
    return el;
  }

  function setNumber(el: HTMLInputElement, value: string): void {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
  }

  function results(target: HTMLElement): string {
    return target.querySelector('.widget-results')?.textContent ?? '';
  }

  it("shows the guide's single filer example by default", () => {
    const target = render();
    const text = results(target);
    expect(text).toContain('$39,200');
    expect(text).toContain('$34,000');
    expect(text).toContain('$8,920');
    expect(text).toContain('56%');
  });

  it('switches thresholds and result for a joint return', () => {
    const target = render();
    const joint = target.querySelector<HTMLInputElement>(
      'input[type="radio"][value="joint"]'
    );
    if (!joint) throw new Error('No joint radio');
    joint.click();
    flushSync();
    const text = results(target);
    expect(text).toContain('$32,000');
    expect(text).toContain('$44,000');
    expect(text).toContain('$3,600');
    expect(text).toContain('23%');
  });

  it('says none is taxable below the first threshold', () => {
    const target = render({ agi: 10000, taxExemptInterest: 0 });
    const text = results(target);
    expect(text).toContain('$18,000');
    expect(text).toContain('$0');
    expect(text).toContain('none');
  });

  it('treats an emptied field as zero rather than breaking', () => {
    const target = render();
    setNumber(input(target, 'Social Security benefits for the year'), '');
    expect(results(target)).toContain('$0');
  });

  it('sizes the taxable share of the bar from the result', () => {
    const target = render();
    const taxable = target.querySelector<HTMLElement>('.share-taxable');
    if (!taxable) throw new Error('No taxable share segment');
    expect(taxable.style.width).toBe('55.75%');
  });

  it('reports one usage event per page view, without values', () => {
    const target = render();
    const agi = input(target, 'Adjusted gross income before Social Security');
    setNumber(agi, '40000');
    setNumber(agi, '41000');
    setNumber(input(target, 'Tax-exempt interest'), '500');
    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith(GUIDE_WIDGET_USED, {
      widget: 'taxable-benefits',
      guide_slug: 'federal-taxes',
    });
  });
});
