import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Birthdate } from '$lib/birthday';
import StrategyPromo from '$lib/components/StrategyPromo.svelte';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';

// The recommendation card inside the promo loads mortality tables and the
// Treasury rate when it mounts; neither matters to the promo's own text.
vi.mock('$lib/life-tables', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/life-tables')>();
  return { ...actual, getDeathProbabilityDistribution: vi.fn() };
});

vi.mock('$lib/strategy/data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/strategy/data')>();
  return { ...actual, fetchRecommendedDiscountRate: vi.fn() };
});

import { getDeathProbabilityDistribution } from '$lib/life-tables';
import { fetchRecommendedDiscountRate } from '$lib/strategy/data';

function recipient(pia: number, birthYear: number): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(birthYear, 3, 15);
  r.setPia(Money.from(pia));
  return r;
}

// Far enough from 62 and 70 that the answer holds whenever the test runs.
const young = () => recipient(2000, 1990);
const pastSeventy = () => recipient(2000, 1940);

describe('StrategyPromo', () => {
  const cleanups: (() => void)[] = [];

  beforeEach(() => {
    vi.mocked(fetchRecommendedDiscountRate).mockResolvedValue({
      date: '2026-09-10',
      rate: 0.031,
      success: true,
    });
    vi.mocked(getDeathProbabilityDistribution).mockResolvedValue([
      { age: 90, probability: 1 },
    ]);
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  function intro(r: Recipient, spouse: Recipient | null): string {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(StrategyPromo, {
      target,
      props: { recipient: r, spouse },
    });
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    flushSync();
    return (target.querySelector('.promo-intro')?.textContent ?? '').replace(
      /\s+/g,
      ' '
    );
  }

  it('offers to adjust the assumptions while a filing age is left to choose', () => {
    expect(intro(young(), null)).toContain(
      'adjust your health and discount-rate assumptions'
    );
    expect(intro(young(), pastSeventy())).toContain(
      "adjust each person's health"
    );
  });

  it('does not promise adjustable assumptions to someone past 70', () => {
    const text = intro(pastSeventy(), null);
    expect(text).toContain('finds the filing age');
    expect(text).not.toMatch(/adjust|health|discount/);
  });

  it('does not promise adjustable assumptions to a couple both past 70', () => {
    const text = intro(pastSeventy(), recipient(1500, 1941));
    expect(text).toContain('finds the filing ages');
    expect(text).not.toMatch(/adjust|health|discount/);
  });
});
