import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { AnnualCola } from '$lib/cola';
import { averageCola, colaHistory } from '$lib/cola';
import ColaHistoryChart from '../../routes/guides/cola/ColaHistoryChart.svelte';

describe('ColaHistoryChart', () => {
  const cleanups: (() => void)[] = [];

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  function render(props: {
    history: AnnualCola[];
    average: number;
  }): HTMLElement {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(ColaHistoryChart, { target, props });
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    flushSync();
    return target;
  }

  const history = colaHistory();
  const average = averageCola();

  it('draws one bar per adjustment on record', () => {
    const target = render({ history, average });
    expect(target.querySelectorAll('.bar').length).toBe(history.length);
  });

  it('names every bar by payment year and percent for hover', () => {
    const target = render({ history, average });
    const titles = [...target.querySelectorAll('.bar title')].map(
      (t) => t.textContent
    );
    expect(titles).toContain('1980: 14.3%');
    expect(titles).toContain('2026: 2.8%');
  });

  it('labels the largest and the latest adjustment directly', () => {
    const target = render({ history, average });
    const labels = [...target.querySelectorAll('.bar-label')].map(
      (t) => t.textContent
    );
    expect(labels).toEqual(['14.3%', '3.6%']);
  });

  it('marks the years with no increase', () => {
    const target = render({ history, average });
    const zeros = history.filter((a) => a.percent === 0).length;
    expect(target.querySelectorAll('.zero-mark').length).toBe(zeros);
  });

  it('shows the long-run average as a reference line', () => {
    const target = render({ history, average });
    expect(target.querySelector('.average-label')?.textContent).toBe(
      `Average ${average.toFixed(1)}%`
    );
  });

  it('labels the year axis every five years', () => {
    const target = render({ history, average });
    const years = [...target.querySelectorAll('.year-label')].map(
      (t) => t.textContent
    );
    expect(years[0]).toBe('1975');
    expect(years).toContain('2000');
    expect(years).toContain('2025');
    expect(years).not.toContain('2026');
  });

  it('keeps bars under the 24px cap and never taller than the plot', () => {
    const target = render({ history, average });
    for (const bar of target.querySelectorAll<SVGPathElement>('.bar path')) {
      const width = Number(bar.dataset.width);
      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(24);
    }
  });

  it('describes itself for assistive technology', () => {
    const target = render({ history, average });
    const svg = target.querySelector('svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toContain('1975');
  });
});
