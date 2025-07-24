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
