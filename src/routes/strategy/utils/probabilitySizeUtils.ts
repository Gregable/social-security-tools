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
export function calculateGridTemplates(
  deathAgeRange: number[],
  probDistribution: { age: number; probability: number }[]
): string {
  // Generate CSS grid template with summed probability sizing
  const sizeParts: string[] = [];

  // Calculate total probability
  const totalProb = probDistribution.reduce(
    (sum, entry) => sum + entry.probability,
    0
  );

  deathAgeRange.forEach((age, index) => {
    // Find the corresponding index in probDistribution
    const startIndex = probDistribution.findIndex((entry) => entry.age >= age);

    // Find the index of the next age in deathAgeRange, or end of probDistribution
    const endIndex =
      index < deathAgeRange.length - 1
        ? probDistribution.findIndex(
            (entry) => entry.age >= deathAgeRange[index + 1]
          )
        : probDistribution.length;

    // Sum probabilities from startIndex to endIndex
    const summedProb = probDistribution
      .slice(startIndex, endIndex)
      .reduce((sum, entry) => sum + entry.probability, 0);

    // Calculate the percentage based on summed probability and round to 1 decimal place
    const percentage = ((summedProb / totalProb) * 100).toFixed(1);

    // Use percentage as grid template value
    sizeParts.push(`${percentage}%`);
  });

  return sizeParts.join(" ");
}
