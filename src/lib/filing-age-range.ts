import { MonthDuration } from './month-time';

/**
 * Represents a range of MonthDuration objects from start to end (inclusive).
 * This is a generic utility class for working with continuous monthly ranges.
 */
export class MonthDurationRange {
  private start: MonthDuration;
  private end: MonthDuration;

  constructor(start: MonthDuration, end: MonthDuration) {
    this.start = start;
    this.end = end;
  }

  /**
   * Gets the starting MonthDuration of the range.
   */
  getStart(): MonthDuration {
    return this.start;
  }

  /**
   * Gets the ending MonthDuration of the range.
   */
  getEnd(): MonthDuration {
    return this.end;
  }

  /**
   * Calculates the number of months in this range.
   */
  getLength(): number {
    return this.end.asMonths() - this.start.asMonths() + 1;
  }

  /**
   * Converts an index to a MonthDuration within this range.
   *
   * @param index - The 0-based index within the range
   * @returns The MonthDuration at the given index
   */
  indexToMonthDuration(index: number): MonthDuration {
    const totalMonths = this.start.asMonths() + index;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return MonthDuration.initFromYearsMonths({ years, months });
  }

  /**
   * Generates an array of MonthDuration objects from start to end (inclusive).
   * Used for functions that still need the full array representation.
   */
  toArray(): MonthDuration[] {
    const result: MonthDuration[] = [];
    const length = this.getLength();

    for (let i = 0; i < length; i++) {
      result.push(this.indexToMonthDuration(i));
    }

    return result;
  }
}
