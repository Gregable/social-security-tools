export function getMonthYearColor(
  currentMonthsSinceEpoch: number,
  minMonthsSinceEpoch: number,
  maxMonthsSinceEpoch: number
): string {
  // Normalize monthsSinceEpoch to a 0-1 range
  const totalMonthsRange = maxMonthsSinceEpoch - minMonthsSinceEpoch;
  let normalizedMonths = 0;
  if (totalMonthsRange > 0) {
    normalizedMonths =
      (currentMonthsSinceEpoch - minMonthsSinceEpoch) / totalMonthsRange;
  }

  // Hue: Map normalizedMonths to a range of hues (e.g., 80 to 160 for a greenish palette)
  const hue = 80 + normalizedMonths * 80; // 80 (yellow-green) to 160 (blue-green)

  // Saturation: Vary saturation to increase contrast (e.g., 60% to 80%)
  const saturation = 60 + normalizedMonths * 20; // 60% to 80%

  // Lightness: Vary lightness to increase contrast (e.g., 80% to 95%)
  // Using a sine wave or similar to create more distinct bands
  const lightness = 80 + (Math.sin(normalizedMonths * Math.PI * 2) * 7.5 + 7.5); // 80% to 95%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
