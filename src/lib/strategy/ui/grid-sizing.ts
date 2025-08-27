/**
 * Calculates the percentage of total probability for each segment of a
 * death age range.
 *
 * @param deathAgeRange An array of ages to calculate grid template values for.
 *   The ages do not need to be contiguous or evenly spaced.
 * @param probDistribution An array of objects with age and probability
 * properties. The age property corresponds to the age, and the probability
 * property is the probability of death at that age.
 * @returns An array of percentages corresponding to each segment of the death age range. The percentages will sum to roughly 100% (modulo rounding). The percentage will represent the cumulative probability of death from the start of each deathAgeRange value until the next one, with the last segment covering all remaining ages.
 *
 * @example
 * const deathAgeRange = [62, 65, 70, 90];
 * const probDistribution = [
 *   { age: 62, probability: 0.1 },
 *   { age: 63, probability: 0.2 },
 *   { age: 64, probability: 0.3 },
 *   { age: 65, probability: 0.4 },
 *   ...
 * ];
 * const percentages = calculateAgeRangePercentages(deathAgeRange, probDistribution);
 * // percentages will be an array like [0.1, 0.2, 0.3, 0.4] representing the
 * cumulative probabilities for each age segment.
 */
export function calculateAgeRangePercentages(
  deathAgeRange: number[],
  probDistribution: { age: number; probability: number }[]
): number[] {
  const segmentProbabilities: number[] = [];

  deathAgeRange.forEach((age, index) => {
    const startIndex = probDistribution.findIndex((entry) => entry.age >= age);
    const endIndex =
      index < deathAgeRange.length - 1
        ? probDistribution.findIndex(
            (entry) => entry.age >= deathAgeRange[index + 1]
          )
        : probDistribution.length;

    const summedProb = probDistribution
      .slice(startIndex, endIndex)
      .reduce((sum, entry) => sum + entry.probability, 0);

    segmentProbabilities.push(summedProb);
  });

  const effectiveTotalProb = segmentProbabilities.reduce(
    (sum, prob) => sum + prob,
    0
  );

  const percentages: number[] = [];
  let sumOfRoundedPercentages = 0;

  for (let i = 0; i < segmentProbabilities.length; i++) {
    let percentage = segmentProbabilities[i] / effectiveTotalProb;
    let roundedPercentageValue: number;

    if (i === segmentProbabilities.length - 1) {
      roundedPercentageValue = 100 - sumOfRoundedPercentages;
    } else {
      roundedPercentageValue = parseFloat(percentage.toFixed(3));
    }
    percentages.push(roundedPercentageValue);
    sumOfRoundedPercentages += roundedPercentageValue;
  }
  return percentages;
}

/**
 * Formats an array of percentages into a CSS grid template string.
 * The last percentage is adjusted to ensure the total sums to 100%.
 * @param percentages An array of percentages to format.
 * @returns A string suitable for use in a CSS grid template.
 * @example
 * const percentages = [0.25, 0.25, 0.25, 0.25];
 * const gridTemplate = formatPercentagesToCssGridTemplate(percentages);
 * // gridTemplate will be "25% 25% 25% 25%"
 */
export function formatPercentagesToCssGridTemplate(
  percentages: number[]
): string {
  const sizeParts: string[] = [];
  // Insufficient precision can lead to a significantly non-100% sum.
  const decimalPlaces = 2;
  let sumOfFormattedPercentages = 0;

  for (let i = 0; i < percentages.length; i++) {
    let formattedPercentageString: string;
    let formattedPercentageValue: number;

    if (i === percentages.length - 1) {
      // For the last element, adjust to make sum exactly 100%
      formattedPercentageValue = 100 - sumOfFormattedPercentages;
      formattedPercentageString =
        formattedPercentageValue.toFixed(decimalPlaces);
    } else {
      formattedPercentageString = (100 * percentages[i]).toFixed(decimalPlaces);
      formattedPercentageValue = parseFloat(formattedPercentageString);
    }
    sizeParts.push(`${formattedPercentageString}%`);
    sumOfFormattedPercentages += formattedPercentageValue;
  }
  return sizeParts.join(' ');
}

/**
 * Generates a death age range starting from a given age, using every other value up to 120.
 * @param deathAgeRangeStart The starting age for the range
 * @returns An array of ages [start, start+2, start+4, ..., up to 120]
 */
export function generateDeathAgeRange(deathAgeRangeStart: number): number[] {
  const deathAgeRange: number[] = [];
  for (let age = deathAgeRangeStart; age <= 100; age += 2) {
    deathAgeRange.push(age);
  }
  return deathAgeRange;
}

import { MonthDuration } from '$lib/month-time';

export interface DeathAgeBucket {
  label: string; // Display label (e.g. '63', '66', '101+')
  // Representative age (middle year for 3-year buckets, or start for + bucket)
  midAge: number;
  startAge: number; // Inclusive start age of the bucket
  endAgeInclusive: number | null; // Inclusive end age; null means open-ended
  probability: number; // Summed probability mass for the bucket
  // Probability-weighted expected death age as MonthDuration (rounded to month)
  expectedAge: MonthDuration; // e.g. 85y5m
}

/**
 * Generate three‑year buckets starting at startAge: [a, a+1, a+2] with label
 * `a+1`, then advance by 3. Continue while (midAge < 100). After that, create
 * a final open-ended bucket starting at the current start age with a "+" label
 * (e.g. '101+'). Only the final bucket may have a 3‑digit label.
 *
 * Depending on alignment the final "+" label could be '99+', '100+' or '101+'.
 */
export function generateThreeYearBuckets(
  startAge: number,
  probDistribution: { age: number; probability: number }[]
): DeathAgeBucket[] {
  const buckets: DeathAgeBucket[] = [];
  const OPEN_ENDED_LIFE_EXPECTANCY_CAP_YEARS = 5; // Cap beyond start age

  let currentStart = startAge;

  const sumProbabilityRange = (from: number, to: number | null): number => {
    if (to === null) {
      return probDistribution
        .filter((e) => e.age >= from)
        .reduce((s, e) => s + e.probability, 0);
    }
    return probDistribution
      .filter((e) => e.age >= from && e.age <= to)
      .reduce((s, e) => s + e.probability, 0);
  };

  // Generate fixed 3-year buckets up to (midAge < 100)
  while (currentStart + 1 < 100) {
    const midAge = currentStart + 1;
    const endAge = currentStart + 2;
    const probability = sumProbabilityRange(currentStart, endAge);
    // Motivation: We show only one label (midAge) for a 3‑year bucket
    // [currentStart, currentStart+1, currentStart+2]. To avoid biasing
    // valuations by assuming everyone dies exactly at an integer age or
    // at year‑end, we model deaths at the probability‑weighted midpoint
    // within each one‑year interval (x + 0.5) under a Uniform Distribution
    // of Deaths (UDD) assumption. Mortality rises with age, so the expected
    // death within the 3‑year set is slightly above the simple midpoint.
    // We convert the weighted mean (in fractional years) to a MonthDuration
    // (rounded to nearest month) and store it as expectedAge.
    let weightedSum = 0;
    let probSum = 0;
    for (let age = currentStart; age <= endAge; age++) {
      const qx = probDistribution.find((e) => e.age === age)?.probability || 0;
      probSum += qx;
      weightedSum += qx * (age + 0.5);
    }
    const expectedAgeFraction =
      probSum > 0 ? weightedSum / probSum : midAge + 0.5; // fallback midpoint
    const totalMonths = Math.round(expectedAgeFraction * 12);
    const expectedAge = MonthDuration.initFromYearsMonths({
      years: Math.floor(totalMonths / 12),
      months: totalMonths % 12,
    });
    buckets.push({
      label: String(midAge),
      midAge,
      startAge: currentStart,
      endAgeInclusive: endAge,
      probability,
      expectedAge,
    });
    currentStart += 3;
  }

  // Final open-ended bucket
  const plusLabel = `${currentStart}+`;
  const finalProb = sumProbabilityRange(currentStart, null);
  // Expected age for open-ended bucket: conditional expectation of age>=start
  // Motivation: For ages beyond the last finite bucket we take the
  // conditional life expectancy using the same UDD mid‑year assumption.
  // Without a cap, very long tails (low prob mass at extreme ages) could
  // push the expected age far out, inflating benefit present values for
  // extremely rare scenarios. We therefore cap additional years beyond
  // the bucket start (default 5y) which is a pragmatic compromise: it
  // captures most remaining expected life while preventing outlier noise.
  let weightedSum = 0;
  let probSum = 0;
  for (const entry of probDistribution) {
    if (entry.age >= currentStart) {
      probSum += entry.probability;
      weightedSum += entry.probability * (entry.age + 0.5);
    }
  }
  let expectedAgeFraction =
    probSum > 0 ? weightedSum / probSum : currentStart + 0.5;
  const cap = currentStart + OPEN_ENDED_LIFE_EXPECTANCY_CAP_YEARS;
  if (expectedAgeFraction > cap) expectedAgeFraction = cap;
  const totalMonths = Math.round(expectedAgeFraction * 12);
  const expectedAge = MonthDuration.initFromYearsMonths({
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  });
  buckets.push({
    label: plusLabel,
    midAge: currentStart, // representative age for optimization
    startAge: currentStart,
    endAgeInclusive: null,
    probability: finalProb,
    expectedAge,
  });

  return buckets;
}

export function calculateGridTemplates(
  deathAgeRange: number[],
  probDistribution: { age: number; probability: number }[]
): string {
  const percentages = calculateAgeRangePercentages(
    deathAgeRange,
    probDistribution
  );
  return formatPercentagesToCssGridTemplate(percentages);
}
