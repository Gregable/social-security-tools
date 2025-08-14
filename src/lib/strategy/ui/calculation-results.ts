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

export enum CalculationStatus {
  Idle = 'idle',
  Running = 'running',
  Complete = 'complete',
}

// Number of different starting age pairs (per scenario multiplier reference)
const CALCULATIONS_PER_SCENARIO = Math.pow((70 - 62) * 12 - 1, 2);

/**
 * Immutable-ish wrapper around a 2D grid of strategy results providing
 * convenience accessors for row/column counts, buckets, and safe access.
 * The generic T should include optional bucket1/bucket2 fields.
 */
export class CalculationResults {
  private grid: StrategyResult[][];
  private _error: string | null = null;
  private _selectedRow: number | null = null;
  private _selectedCol: number | null = null;
  private _status: CalculationStatus = CalculationStatus.Idle;
  // Timing & progress
  private _startTime: number | null = null;
  private _timeElapsedSeconds = 0;
  private _progress = 0; // number of sub-calculations completed
  private _total = 0; // total sub-calculations expected
  private _perScenarioMultiplier = CALCULATIONS_PER_SCENARIO; // multiplier applied to rows*cols for total calculations

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
    // Clear any selection when an error occurs
    this._selectedRow = null;
    this._selectedCol = null;
    this._status = CalculationStatus.Idle;
  }

  error(): string | null {
    return this._error;
  }

  setSelectedCell(row: number, col: number): void {
    if (row < 0 || col < 0 || row >= this.rows() || col >= this.cols()) {
      this._selectedRow = null;
      this._selectedCol = null;
      return;
    }
    this._selectedRow = row;
    this._selectedCol = col;
  }

  clearSelectedCell(): void {
    this._selectedRow = null;
    this._selectedCol = null;
  }

  getSelectedCell(): { row: number; col: number } | null {
    if (this._selectedRow === null || this._selectedCol === null) return null;
    return { row: this._selectedRow, col: this._selectedCol };
  }

  getSelectedCellData(): StrategyResult | undefined {
    if (this._selectedRow === null || this._selectedCol === null)
      return undefined;
    return this.get(this._selectedRow, this._selectedCol);
  }

  isSelected(row: number, col: number): boolean {
    return this._selectedRow === row && this._selectedCol === col;
  }

  // Status API
  status(): CalculationStatus {
    return this._status;
  }

  setStatus(status: CalculationStatus): void {
    this._status = status;
  }

  // Progress / timing API
  // Optional override if caller wants custom multiplier
  setPerScenarioMultiplier(multiplier: number): void {
    if (multiplier > 0) this._perScenarioMultiplier = multiplier;
  }

  beginRun(totalCalculations?: number): void {
    this._error = null;
    this._progress = 0;
    if (typeof totalCalculations === 'number') {
      this._total = totalCalculations;
    } else {
      // compute from current grid size * multiplier
      this._total = this.rows() * this.cols() * this._perScenarioMultiplier;
    }
    this._startTime = Date.now();
    this._timeElapsedSeconds = 0;
    this.setStatus(CalculationStatus.Running);
  }

  addProgress(delta: number): void {
    this._progress += delta;
    if (this._progress > this._total) this._progress = this._total;
  }

  addScenarioProgress(): void {
    this.addProgress(this._perScenarioMultiplier);
  }

  completeRun(): void {
    if (this._startTime) {
      this._timeElapsedSeconds = (Date.now() - this._startTime) / 1000;
    }
    this.setStatus(CalculationStatus.Complete);
  }

  failRun(message: string): void {
    if (this._startTime) {
      this._timeElapsedSeconds = (Date.now() - this._startTime) / 1000;
    }
    this.setError(message);
  }

  timeElapsed(): number {
    return this._timeElapsedSeconds;
  }
  calculationProgress(): number {
    return this._progress;
  }
  totalCalculations(): number {
    return this._total;
  }
  startTime(): number | null {
    return this._startTime;
  }

  /** Convenience: get bucket labels for each row. */
  rowLabels(): string[] {
    return this.rowBuckets().map((b) => b.label);
  }

  /** Convenience: get bucket labels for each column. */
  colLabels(): string[] {
    return this.colBuckets().map((b) => b.label);
  }

  /** Find row index by its bucket label. Returns -1 if not found. */
  findRowIndexByLabel(label: string): number {
    const labels = this.rowLabels();
    return labels.indexOf(label);
  }

  /** Find column index by its bucket label. Returns -1 if not found. */
  findColIndexByLabel(label: string): number {
    const labels = this.colLabels();
    return labels.indexOf(label);
  }

  /** Set selection by bucket labels. Returns true if selection succeeded. */
  setSelectedByLabels(rowLabel: string, colLabel: string): boolean {
    const r = this.findRowIndexByLabel(rowLabel);
    const c = this.findColIndexByLabel(colLabel);
    if (r < 0 || c < 0) return false;
    this.setSelectedCell(r, c);
    return true;
  }

  /** Get selected bucket labels, or null if no selection. */
  getSelectedLabels(): { rowLabel: string; colLabel: string } | null {
    const pos = this.getSelectedCell();
    if (!pos) return null;
    const rowLabel = this.rowLabels()[pos.row];
    const colLabel = this.colLabels()[pos.col];
    if (rowLabel === undefined || colLabel === undefined) return null;
    return { rowLabel, colLabel };
  }

  /** Check selection by bucket labels. */
  isSelectedLabels(rowLabel: string, colLabel: string): boolean {
    const pos = this.getSelectedCell();
    if (!pos) return false;
    const rOk = this.rowLabels()[pos.row] === rowLabel;
    const cOk = this.colLabels()[pos.col] === colLabel;
    return rOk && cOk;
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
