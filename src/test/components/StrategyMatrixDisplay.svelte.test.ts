import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { NoChoiceReasons } from '$lib/components/recommended-filing-card';
import StrategyMatrixDisplay from '../../routes/strategy/components/StrategyMatrixDisplay.svelte';
import {
  createCoupleCalculationResults,
  createDeathProbDistribution,
  createRecipientPair,
} from '../helpers/strategy-mocks';

/** Couple results with the run complete, as the page shows them. */
function completeResults() {
  const results = createCoupleCalculationResults();
  results.beginRun(1000);
  results.addProgress(1000);
  results.completeRun();
  return results;
}

describe('StrategyMatrixDisplay', () => {
  const cleanups: (() => void)[] = [];

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  /** Renders Alex and Jordan's results and returns their text. */
  function render(noChoiceReasons: NoChoiceReasons): string {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const component = mount(StrategyMatrixDisplay, {
      target,
      props: {
        recipients: createRecipientPair(),
        calculationResults: completeResults(),
        deathProbDistribution1: createDeathProbDistribution(62),
        deathProbDistribution2: createDeathProbDistribution(62),
        displayAsAges: false,
        noChoiceReasons,
      },
    });
    cleanups.push(() => {
      unmount(component);
      target.remove();
    });
    flushSync();
    return (target.textContent ?? '').replace(/\s+/g, ' ');
  }

  describe('with nobody left to choose', () => {
    it('explains one past 70 beside one with no benefit of their own', () => {
      const text = render(['past-seventy', 'spousal-only']);
      expect(text).toContain('One of you is past 70');
      expect(text).toContain(
        'The other has no retirement benefit of their own and has reached full retirement age, where spousal benefits stop growing.'
      );
      expect(text).toContain(
        "a spousal benefit never starts before the other's retirement benefit"
      );
    });

    it('explains one already filed beside one with no benefit of their own', () => {
      const text = render(['filed', 'spousal-only']);
      expect(text).toContain('One of you already receives benefits.');
      expect(text).toContain('File for the spousal benefit now');
      expect(text).not.toContain('past 70');
    });
  });

  describe('with one of the two left to choose', () => {
    it('says why a spouse with no benefit of their own gets no grid', () => {
      const text = render([null, 'spousal-only']);
      expect(text).toContain(
        'Jordan has no retirement benefit of their own and has reached full retirement age, so there is no grid for them'
      );
      expect(text).toContain("can start only once Alex's benefits do");
      expect(text).not.toContain('Jordan is past 70');
    });

    it('still says why someone past 70 or already filed gets no grid', () => {
      expect(render([null, 'past-seventy'])).toContain(
        'Jordan is past 70, so there is no grid for them'
      );
      expect(render([null, 'filed'])).toContain(
        'Jordan already receives benefits, so there is no grid for them'
      );
    });
  });
});
