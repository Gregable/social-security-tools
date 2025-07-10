/**
 * Converts death age probability distributions to CSS Grid template values.
 *
 * @param deathAgeRange An array of ages to calculate grid template values for.
 *   The ages do not need to be contiguous or evenly spaced.
 * @param probDistribution An array of objects with age and probability properties.
 *   The age property corresponds to the age, and the probability property is the
 *   probability of death at that age.
 * @returns A string of space-separated percentage values to be used as a
 *   CSS grid-template-columns or grid-template-rows value.
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
 * const gridTemplate = calculateGridTemplates(deathAgeRange, probDistribution);
 * // gridTemplate: "20% 50% 90% 100%"
 * // 20% = 0.1 + 0.2 + 0.3 (62 to 64)
 * // 50% = 0.4 + ... (65 to 69)
 * // 90% = ... (70 to 89)
 * // 100% = ... (90 to end)
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
    let percentage = (segmentProbabilities[i] / effectiveTotalProb) * 100;
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

export function formatPercentagesToCssGridTemplate(
  percentages: number[],
  decimalPlaces: number
): string {
  const sizeParts: string[] = [];
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
      formattedPercentageString = percentages[i].toFixed(decimalPlaces);
      formattedPercentageValue = parseFloat(formattedPercentageString);
    }
    sizeParts.push(`${formattedPercentageString}%`);
    sumOfFormattedPercentages += formattedPercentageValue;
  }
  return sizeParts.join(" ");
}

export function calculateGridTemplates(
  deathAgeRange: number[],
  probDistribution: { age: number; probability: number }[]
): string {
  const percentages = calculateAgeRangePercentages(
    deathAgeRange,
    probDistribution
  );
  return formatPercentagesToCssGridTemplate(percentages, 3); // Using 3 decimal places as per previous discussion
}
