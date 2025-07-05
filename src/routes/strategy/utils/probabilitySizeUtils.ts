/**
 * Converts death age probabilities to CSS Grid template values with direct probability scaling
 */
export function calculateGridTemplates(
  deathAgeRange: number[],
  calculationResults: any[][],
  dimension: "row" | "column"
): string {
  // Determine which probability to use based on dimension
  const probabilityKey = dimension === "row" ? "deathProb1" : "deathProb2";

  // Generate CSS grid template with direct probability sizing
  const sizeParts: string[] = [];

  // Calculate total probability to normalize values (ensure they add up to something reasonable)
  let totalProb = 0;
  deathAgeRange.forEach((_, index) => {
    const prob =
      dimension === "row"
        ? calculationResults[index][0][probabilityKey]
        : calculationResults[0][index][probabilityKey];
    totalProb += prob;
  });

  // Scale factor to make grid cells more reasonably sized
  // The 100 value ensures our fr units aren't too tiny
  const scaleFactor = 1 / totalProb;

  deathAgeRange.forEach((_, index) => {
    // For rows, use the probability from the first column of each row
    // For columns, use the probability from the first row of each column
    const prob =
      dimension === "row"
        ? calculationResults[index][0][probabilityKey]
        : calculationResults[0][index][probabilityKey];

    // Scale the probability to get better visual proportions
    const scaledProb = 100 * prob * scaleFactor;

    // Use scaled probability value as fr units
    sizeParts.push(`${scaledProb}%`);
  });

  return sizeParts.join(" ");
}
