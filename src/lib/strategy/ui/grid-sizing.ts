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
    const percentage = segmentProbabilities[i] / effectiveTotalProb;
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
    // Simplified approach: use midAge + 0.5 for all buckets
    const expectedAgeFraction = midAge + 0.5;
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
  // Simplified approach: for 101+ bucket, use 102.5 as modeled age
  const expectedAgeFraction = 102.5;
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

/**
 * Generate one-year buckets starting at startAge: [a] with label `a`.
 * Continue while (age < 100). After that, create a final open-ended bucket
 * starting at the current start age with a "+" label (e.g. '100+').
 */
export function generateOneYearBuckets(
  startAge: number,
  probDistribution: { age: number; probability: number }[]
): DeathAgeBucket[] {
  const buckets: DeathAgeBucket[] = [];

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

  // Generate 1-year buckets up to 100
  while (currentStart < 100) {
    const probability = sumProbabilityRange(currentStart, currentStart);
    const expectedAgeFraction = currentStart + 0.5;
    const totalMonths = Math.round(expectedAgeFraction * 12);
    const expectedAge = MonthDuration.initFromYearsMonths({
      years: Math.floor(totalMonths / 12),
      months: totalMonths % 12,
    });

    buckets.push({
      label: String(currentStart),
      midAge: currentStart,
      startAge: currentStart,
      endAgeInclusive: currentStart,
      probability,
      expectedAge,
    });
    currentStart += 1;
  }

  // Final open-ended bucket
  const plusLabel = `${currentStart}+`;
  const finalProb = sumProbabilityRange(currentStart, null);
  // Use 102.5 as modeled age for consistency with 3-year buckets
  const expectedAgeFraction = 102.5;
  const totalMonths = Math.round(expectedAgeFraction * 12);
  const expectedAge = MonthDuration.initFromYearsMonths({
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  });
  buckets.push({
    label: plusLabel,
    midAge: currentStart,
    startAge: currentStart,
    endAgeInclusive: null,
    probability: finalProb,
    expectedAge,
  });

  return buckets;
}

/**
 * Generate monthly buckets starting at startAge.
 * Continue while (age < 100). After that, create a final open-ended bucket.
 */
export function generateMonthlyBuckets(
  startAge: number,
  probDistribution: { age: number; probability: number }[]
): DeathAgeBucket[] {
  const buckets: DeathAgeBucket[] = [];

  let currentAgeMonths = Math.floor(startAge * 12);
  const endAgeMonths = 100 * 12;

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

  while (currentAgeMonths < endAgeMonths) {
    const year = Math.floor(currentAgeMonths / 12);
    const month = currentAgeMonths % 12;

    // Approximate probability (1/12 of the year's probability)
    const yearProb =
      probDistribution.find((p) => p.age === year)?.probability || 0;
    const probability = yearProb / 12;

    const expectedAge = MonthDuration.initFromYearsMonths({
      years: year,
      months: month,
    });

    buckets.push({
      label: `${year}m${month}`,
      midAge: currentAgeMonths / 12,
      startAge: currentAgeMonths / 12,
      endAgeInclusive: (currentAgeMonths + 1) / 12,
      probability,
      expectedAge,
    });
    currentAgeMonths++;
  }

  // Final open-ended bucket
  const finalStartAge = currentAgeMonths / 12;
  const plusLabel = `${Math.floor(finalStartAge)}+`;
  const finalProb = sumProbabilityRange(Math.floor(finalStartAge), null);

  const expectedAgeFraction = 102.5;
  const totalMonths = Math.round(expectedAgeFraction * 12);
  const expectedAge = MonthDuration.initFromYearsMonths({
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  });

  buckets.push({
    label: plusLabel,
    midAge: finalStartAge,
    startAge: finalStartAge,
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
