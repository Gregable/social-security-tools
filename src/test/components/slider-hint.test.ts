import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SLIDER_HINT_DWELL_MS,
  SLIDER_HINT_REARM_MS,
  SliderHint,
} from '$lib/components/slider-hint';

describe('SliderHint', () => {
  let shown: number;
  let hint: SliderHint;

  beforeEach(() => {
    vi.useFakeTimers();
    shown = 0;
    hint = new SliderHint(() => {
      shown += 1;
    });
  });

  afterEach(() => {
    hint.dispose();
    vi.useRealTimers();
  });

  /** Rests the pointer on the chart long enough for a hint to be shown. */
  function restOnChart() {
    hint.pointerOverChart();
    vi.advanceTimersByTime(SLIDER_HINT_DWELL_MS);
  }

  it('shows the hint once the pointer has rested on the chart', () => {
    hint.pointerOverChart();
    vi.advanceTimersByTime(SLIDER_HINT_DWELL_MS - 1);
    expect(shown).toBe(0);
    vi.advanceTimersByTime(1);
    expect(shown).toBe(1);
  });

  it('measures the rest from the first move, not the latest one', () => {
    hint.pointerOverChart();
    vi.advanceTimersByTime(SLIDER_HINT_DWELL_MS - 1);
    hint.pointerOverChart();
    vi.advanceTimersByTime(1);
    expect(shown).toBe(1);
  });

  it('does not show the hint for a pointer that only passes over', () => {
    hint.pointerOverChart();
    vi.advanceTimersByTime(SLIDER_HINT_DWELL_MS - 1);
    hint.pointerLeftChart();
    vi.advanceTimersByTime(SLIDER_HINT_DWELL_MS);
    expect(shown).toBe(0);
  });

  it('shows the hint only once while the pointer stays on the chart', () => {
    restOnChart();
    hint.pointerOverChart();
    vi.advanceTimersByTime(SLIDER_HINT_REARM_MS * 2);
    expect(shown).toBe(1);
  });

  it('does not repeat the hint after a short time away', () => {
    restOnChart();
    hint.pointerLeftChart();
    vi.advanceTimersByTime(SLIDER_HINT_REARM_MS - 1);
    restOnChart();
    expect(shown).toBe(1);
  });

  it('starts the time away afresh each time the pointer leaves', () => {
    restOnChart();
    hint.pointerLeftChart();
    vi.advanceTimersByTime(SLIDER_HINT_REARM_MS - 1);
    hint.pointerOverChart();
    hint.pointerLeftChart();
    vi.advanceTimersByTime(SLIDER_HINT_REARM_MS - 1);
    restOnChart();
    expect(shown).toBe(1);
  });

  it('repeats the hint after a long time away', () => {
    restOnChart();
    hint.pointerLeftChart();
    vi.advanceTimersByTime(SLIDER_HINT_REARM_MS);
    restOnChart();
    expect(shown).toBe(2);
  });

  it('never shows the hint once the slider has been used', () => {
    hint.sliderUsed();
    restOnChart();
    expect(shown).toBe(0);
  });

  it('cancels a hint that is about to show when the slider is used', () => {
    hint.pointerOverChart();
    vi.advanceTimersByTime(SLIDER_HINT_DWELL_MS - 1);
    hint.sliderUsed();
    vi.advanceTimersByTime(SLIDER_HINT_DWELL_MS);
    expect(shown).toBe(0);
  });

  it('does not repeat the hint after the slider has been used', () => {
    restOnChart();
    hint.sliderUsed();
    hint.pointerLeftChart();
    vi.advanceTimersByTime(SLIDER_HINT_REARM_MS);
    restOnChart();
    expect(shown).toBe(1);
  });

  it('shows nothing after it is disposed', () => {
    hint.pointerOverChart();
    hint.dispose();
    vi.advanceTimersByTime(SLIDER_HINT_DWELL_MS);
    expect(shown).toBe(0);
  });
});
