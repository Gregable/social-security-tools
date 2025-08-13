import type { DeathAgeBucket } from './grid-sizing.js';
import type { MonthDuration } from '$lib/month-time';
import type { Money } from '$lib/money';

export interface StrategyResult {
  deathAge1: string;
  deathAge2: string;
  bucket1: DeathAgeBucket;
  bucket2: DeathAgeBucket;
  filingAge1: MonthDuration;
  filingAge2: MonthDuration;
  totalBenefit: Money;
  filingAge1Years: number;
  filingAge1Months: number;
  filingAge2Years: number;
  filingAge2Months: number;
  deathProb1?: number;
  deathProb2?: number;
}

/**
 * Immutable-ish wrapper around a 2D grid of strategy results providing
 * convenience accessors for row/column counts, buckets, and safe access.
 * The generic T should include optional bucket1/bucket2 fields.
 */
export class CalculationResults {
  private grid: StrategyResult[][];
  private _error: string | null = null;

  constructor(rows: number = 0, cols: number = 0) {
    this.grid = Array(rows)
      .fill(null)
      .map(() => Array(cols));
  }

  rows(): number {
    return this.grid.length;
  }

  cols(): number {
    return this.grid[0]?.length ?? 0;
  }

  get(i: number, j: number): StrategyResult | undefined {
    return this.grid[i]?.[j];
  }

  set(i: number, j: number, value: StrategyResult): void {
    if (!this.grid[i]) this.grid[i] = [] as StrategyResult[];
    this.grid[i][j] = value;
  }

  to2D(): StrategyResult[][] {
    return this.grid;
  }

  setError(message: string): void {
    this._error = message;
    this.grid = [];
  }

  error(): string | null {
    return this._error;
  }

  rowBuckets(): DeathAgeBucket[] {
    if (this._error) return [];
    const rows = this.rows();
    const out: DeathAgeBucket[] = [];
    for (let i = 0; i < rows; i++) {
      const first = this.get(i, 0);
      if (first?.bucket1) out.push(first.bucket1);
    }
    return out;
  }

  colBuckets(): DeathAgeBucket[] {
    if (this._error) return [];
    const cols = this.cols();
    const out: DeathAgeBucket[] = [];
    for (let j = 0; j < cols; j++) {
      const first = this.get(0, j);
      if (first?.bucket2) out.push(first.bucket2);
    }
    return out;
  }
}
