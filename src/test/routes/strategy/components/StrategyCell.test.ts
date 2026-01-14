import { describe, expect, it } from 'vitest';

/**
 * Tests for StrategyCell component logic.
 *
 * These tests focus on cell content formatting and highlight state logic.
 */

/**
 * Get a formatted string representing the filing age based on cell dimensions.
 * Replicates the logic from formatting.ts
 */
function getFilingAge(
  filingAgeYears: number,
  filingAgeMonths: number,
  cellWidth: number = 0
): string {
  if (filingAgeMonths === 0) {
    return `${filingAgeYears}`;
  } else if (cellWidth < 40) {
    return `${filingAgeYears}...`;
  } else if (cellWidth < 50) {
    return `${filingAgeYears} ${filingAgeMonths}m`;
  } else if (cellWidth < 80) {
    return `${filingAgeYears} ${filingAgeMonths}mo`;
  } else {
    const monthText = filingAgeMonths === 1 ? 'month' : 'months';
    return `${filingAgeYears} ${filingAgeMonths} ${monthText}`;
  }
}

/**
 * Determine if a cell is the directly hovered cell.
 */
function isHighlightedCell(
  cellRow: number,
  cellCol: number,
  hoveredCell: { rowIndex: number; colIndex: number } | null
): boolean {
  return (
    hoveredCell !== null &&
    hoveredCell.rowIndex === cellRow &&
    hoveredCell.colIndex === cellCol
  );
}

/**
 * Determine if a cell is in the same row as the hovered cell (crosshair).
 */
function isHighlightedRow(
  cellRow: number,
  cellCol: number,
  hoveredCell: { rowIndex: number; colIndex: number } | null
): boolean {
  return (
    hoveredCell !== null &&
    hoveredCell.rowIndex === cellRow &&
    hoveredCell.colIndex !== cellCol
  );
}

/**
 * Determine if a cell is in the same column as the hovered cell (crosshair).
 */
function isHighlightedColumn(
  cellRow: number,
  cellCol: number,
  hoveredCell: { rowIndex: number; colIndex: number } | null
): boolean {
  return (
    hoveredCell !== null &&
    hoveredCell.rowIndex !== cellRow &&
    hoveredCell.colIndex === cellCol
  );
}

describe('StrategyCell', () => {
  describe('getFilingAge formatting', () => {
    it('shows only years when months is 0', () => {
      expect(getFilingAge(67, 0, 100)).toBe('67');
      expect(getFilingAge(62, 0, 50)).toBe('62');
      expect(getFilingAge(70, 0, 30)).toBe('70');
    });

    it('shows abbreviated format for very small cells (<40px)', () => {
      expect(getFilingAge(67, 6, 35)).toBe('67...');
      expect(getFilingAge(62, 3, 30)).toBe('62...');
    });

    it('shows compact format for small cells (40-50px)', () => {
      expect(getFilingAge(67, 6, 45)).toBe('67 6m');
      expect(getFilingAge(62, 11, 42)).toBe('62 11m');
    });

    it('shows medium format for medium cells (50-80px)', () => {
      expect(getFilingAge(67, 6, 60)).toBe('67 6mo');
      expect(getFilingAge(65, 3, 75)).toBe('65 3mo');
    });

    it('shows full format for large cells (>=80px)', () => {
      expect(getFilingAge(67, 6, 100)).toBe('67 6 months');
      expect(getFilingAge(65, 1, 85)).toBe('65 1 month');
      expect(getFilingAge(62, 11, 150)).toBe('62 11 months');
    });

    it('uses singular "month" for 1 month in large cells', () => {
      expect(getFilingAge(67, 1, 100)).toBe('67 1 month');
    });

    it('uses plural "months" for > 1 month in large cells', () => {
      expect(getFilingAge(67, 2, 100)).toBe('67 2 months');
      expect(getFilingAge(67, 11, 100)).toBe('67 11 months');
    });
  });

  describe('Cell highlight state', () => {
    describe('isHighlightedCell', () => {
      it('returns true when cell is directly hovered', () => {
        const hoveredCell = { rowIndex: 5, colIndex: 5 };
        expect(isHighlightedCell(5, 5, hoveredCell)).toBe(true);
      });

      it('returns false when different cell is hovered', () => {
        const hoveredCell = { rowIndex: 5, colIndex: 5 };
        expect(isHighlightedCell(5, 6, hoveredCell)).toBe(false);
        expect(isHighlightedCell(6, 5, hoveredCell)).toBe(false);
        expect(isHighlightedCell(3, 7, hoveredCell)).toBe(false);
      });

      it('returns false when no cell is hovered', () => {
        expect(isHighlightedCell(5, 5, null)).toBe(false);
      });
    });

    describe('isHighlightedRow', () => {
      it('returns true when in same row as hovered cell (different column)', () => {
        const hoveredCell = { rowIndex: 5, colIndex: 5 };
        expect(isHighlightedRow(5, 3, hoveredCell)).toBe(true);
        expect(isHighlightedRow(5, 7, hoveredCell)).toBe(true);
        expect(isHighlightedRow(5, 0, hoveredCell)).toBe(true);
      });

      it('returns false when directly hovered', () => {
        const hoveredCell = { rowIndex: 5, colIndex: 5 };
        expect(isHighlightedRow(5, 5, hoveredCell)).toBe(false);
      });

      it('returns false when in different row', () => {
        const hoveredCell = { rowIndex: 5, colIndex: 5 };
        expect(isHighlightedRow(4, 3, hoveredCell)).toBe(false);
        expect(isHighlightedRow(6, 5, hoveredCell)).toBe(false);
      });

      it('returns false when no cell is hovered', () => {
        expect(isHighlightedRow(5, 3, null)).toBe(false);
      });
    });

    describe('isHighlightedColumn', () => {
      it('returns true when in same column as hovered cell (different row)', () => {
        const hoveredCell = { rowIndex: 5, colIndex: 5 };
        expect(isHighlightedColumn(3, 5, hoveredCell)).toBe(true);
        expect(isHighlightedColumn(7, 5, hoveredCell)).toBe(true);
        expect(isHighlightedColumn(0, 5, hoveredCell)).toBe(true);
      });

      it('returns false when directly hovered', () => {
        const hoveredCell = { rowIndex: 5, colIndex: 5 };
        expect(isHighlightedColumn(5, 5, hoveredCell)).toBe(false);
      });

      it('returns false when in different column', () => {
        const hoveredCell = { rowIndex: 5, colIndex: 5 };
        expect(isHighlightedColumn(3, 4, hoveredCell)).toBe(false);
        expect(isHighlightedColumn(5, 6, hoveredCell)).toBe(false);
      });

      it('returns false when no cell is hovered', () => {
        expect(isHighlightedColumn(3, 5, null)).toBe(false);
      });
    });

    describe('Combined highlight states', () => {
      it('only one highlight state is true at a time', () => {
        const hoveredCell = { rowIndex: 5, colIndex: 5 };

        // Directly hovered cell
        expect(isHighlightedCell(5, 5, hoveredCell)).toBe(true);
        expect(isHighlightedRow(5, 5, hoveredCell)).toBe(false);
        expect(isHighlightedColumn(5, 5, hoveredCell)).toBe(false);

        // Same row
        expect(isHighlightedCell(5, 3, hoveredCell)).toBe(false);
        expect(isHighlightedRow(5, 3, hoveredCell)).toBe(true);
        expect(isHighlightedColumn(5, 3, hoveredCell)).toBe(false);

        // Same column
        expect(isHighlightedCell(3, 5, hoveredCell)).toBe(false);
        expect(isHighlightedRow(3, 5, hoveredCell)).toBe(false);
        expect(isHighlightedColumn(3, 5, hoveredCell)).toBe(true);

        // Different row and column
        expect(isHighlightedCell(3, 3, hoveredCell)).toBe(false);
        expect(isHighlightedRow(3, 3, hoveredCell)).toBe(false);
        expect(isHighlightedColumn(3, 3, hoveredCell)).toBe(false);
      });
    });
  });

  describe('Cell content determination', () => {
    /**
     * Simulates getCellContentReactive logic
     */
    function getCellContent(
      calculationResult: any,
      displayAsAges: boolean,
      recipientIndex: number,
      cellWidth: number
    ): string {
      if (!calculationResult) return 'N/A';

      const filingAgeYears =
        calculationResult[`filingAge${recipientIndex + 1}Years`];
      const filingAgeMonths =
        calculationResult[`filingAge${recipientIndex + 1}Months`];

      if (displayAsAges) {
        return getFilingAge(filingAgeYears, filingAgeMonths, cellWidth);
      }
      // For dates, we'd need birthdate - simplified test
      return `Filing at ${filingAgeYears}y ${filingAgeMonths}m`;
    }

    it('returns N/A for null result', () => {
      expect(getCellContent(null, true, 0, 100)).toBe('N/A');
    });

    it('returns age format when displayAsAges is true', () => {
      const result = {
        filingAge1Years: 67,
        filingAge1Months: 6,
      };
      const content = getCellContent(result, true, 0, 100);
      expect(content).toBe('67 6 months');
    });

    it('uses correct recipient index for field access', () => {
      const result = {
        filingAge1Years: 67,
        filingAge1Months: 6,
        filingAge2Years: 65,
        filingAge2Months: 3,
      };

      // Recipient 0 -> filingAge1
      expect(getCellContent(result, true, 0, 100)).toBe('67 6 months');
      // Recipient 1 -> filingAge2
      expect(getCellContent(result, true, 1, 100)).toBe('65 3 months');
    });
  });
});
