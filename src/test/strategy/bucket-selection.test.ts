import { describe, it, expect } from 'vitest';

// We test selection mapping logic indirectly by emulating the mapping from
// bucket label arrays to a selected cell's death ages.

interface DeathAgeBucket { label: string; midAge: number; startAge: number; endAgeInclusive: number | null; probability: number; }

function makeBuckets(labels: string[]): DeathAgeBucket[] {
  return labels.map((lbl, i) => ({
    label: lbl,
    midAge: 60 + i * 3 + 1, // synthetic midAge just for shape
    startAge: 60 + i * 3,
    endAgeInclusive: lbl.endsWith('+') ? null : 60 + i * 3 + 2,
    probability: 0.1,
  }));
}

function getSelectionData(rowIndex: number, colIndex: number, rowBuckets: DeathAgeBucket[], colBuckets: DeathAgeBucket[]) {
  const bucket1 = rowBuckets[rowIndex];
  const bucket2 = colBuckets[colIndex];
  return { deathAge1: bucket1.label, deathAge2: bucket2.label };
}

describe('bucket selection mapping', () => {
  it('maps standard bucket labels correctly', () => {
    const rows = makeBuckets(['63','66','69']);
    const cols = makeBuckets(['63','66','69']);
    const sel = getSelectionData(1,2,rows,cols);
    expect(sel.deathAge1).toBe('66');
    expect(sel.deathAge2).toBe('69');
  });

  it('handles open-ended + bucket labels', () => {
    const rows = makeBuckets(['63','66','99+']);
    const cols = makeBuckets(['63','66','99+']);
    const sel = getSelectionData(2,2,rows,cols);
    expect(sel.deathAge1).toBe('99+');
    expect(sel.deathAge2).toBe('99+');
  });

  it('differentiates between numeric midAge and label semantics', () => {
    // Ensure label is what would be emitted even if midAge differs
    const rows = [
      { label: '101+', midAge: 101, startAge: 101, endAgeInclusive: null, probability: 0.2 },
    ];
    const cols = [
      { label: '101+', midAge: 101, startAge: 101, endAgeInclusive: null, probability: 0.2 },
    ];
    const sel = getSelectionData(0,0,rows,cols);
    expect(sel.deathAge1).toBe('101+');
    expect(sel.deathAge2).toBe('101+');
  });
});
