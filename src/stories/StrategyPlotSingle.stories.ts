import type { Meta, StoryObj } from '@storybook/svelte';
import { Money } from '../lib/money';
import { MonthDuration } from '../lib/month-time';
import { Recipient } from '../lib/recipient';
import type { DeathAgeBucket } from '../lib/strategy/ui';
import { parseBirthdate } from '../lib/strategy/ui';
import { CalculationResults } from '../lib/strategy/ui/calculation-results';
import StrategyPlotSingle from '../routes/strategy/components/StrategyPlotSingle.svelte';

const meta: Meta<StrategyPlotSingle> = {
  title: 'Strategy/StrategyPlotSingle',
  component: StrategyPlotSingle,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function createRecipient(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  piaAmount: number
): Recipient {
  const recipient = new Recipient();
  recipient.birthdate = parseBirthdate(
    `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`
  );
  recipient.setPia(Money.from(piaAmount));
  recipient.name = 'Alex';
  recipient.markFirst();
  return recipient;
}

function createBucket(startAge: number, label?: string): DeathAgeBucket {
  return {
    label: label ?? startAge.toString(),
    midAge: startAge,
    startAge,
    endAgeInclusive: startAge,
    probability: 0.03,
    expectedAge: new MonthDuration(startAge * 12),
  };
}

/**
 * Creates mock calculation results with a typical filing age curve using monthly buckets.
 * Filing age starts at minimum (62) for early death ages, then increases
 * gradually to 70 for later death ages.
 */
function createTypicalCalculationResults(): CalculationResults {
  // Use monthly buckets from age 62 to 100 (456 months of data)
  const startAge = 62;
  const endAge = 100;
  const numRows = (endAge - startAge) * 12;
  const results = new CalculationResults(numRows, 1);

  for (let i = 0; i < numRows; i++) {
    const deathAgeMonths = startAge * 12 + i;
    const deathAge = deathAgeMonths / 12;

    // Filing age increases from 62 to 70 based on death age
    // Below ~75: file at 62, gradually increasing, above ~88: file at 70
    let filingAgeMonths: number;
    if (deathAge <= 75) {
      filingAgeMonths = 62 * 12; // File at 62
    } else if (deathAge >= 88) {
      filingAgeMonths = 70 * 12; // File at 70
    } else {
      // Linear interpolation between 75 and 88
      const ratio = (deathAge - 75) / 13;
      filingAgeMonths = Math.round(62 * 12 + ratio * (70 - 62) * 12);
    }

    results.set(i, 0, {
      deathAge1: deathAge.toFixed(2),
      bucket1: createBucket(deathAge),
      filingAge1: new MonthDuration(filingAgeMonths),
      totalBenefit: Money.from(500000 + deathAge * 1000),
      filingAge1Years: Math.floor(filingAgeMonths / 12),
      filingAge1Months: filingAgeMonths % 12,
    });
  }

  return results;
}

/**
 * Creates calculation results where filing at 62 is always optimal
 * (e.g., high discount rate scenario).
 */
function createFlatEarlyFilingResults(): CalculationResults {
  const startAge = 62;
  const endAge = 100;
  const numRows = (endAge - startAge) * 12;
  const results = new CalculationResults(numRows, 1);

  for (let i = 0; i < numRows; i++) {
    const deathAgeMonths = startAge * 12 + i;
    const deathAge = deathAgeMonths / 12;
    const filingAgeMonths = 62 * 12; // Always file at 62

    results.set(i, 0, {
      deathAge1: deathAge.toFixed(2),
      bucket1: createBucket(deathAge),
      filingAge1: new MonthDuration(filingAgeMonths),
      totalBenefit: Money.from(400000 + deathAge * 500),
      filingAge1Years: 62,
      filingAge1Months: 0,
    });
  }

  return results;
}

/**
 * Creates calculation results where filing at 70 is always optimal
 * (e.g., very low discount rate, long life expectancy).
 */
function createFlatLateFilingResults(): CalculationResults {
  const startAge = 62;
  const endAge = 100;
  const numRows = (endAge - startAge) * 12;
  const results = new CalculationResults(numRows, 1);

  for (let i = 0; i < numRows; i++) {
    const deathAgeMonths = startAge * 12 + i;
    const deathAge = deathAgeMonths / 12;
    const filingAgeMonths = 70 * 12; // Always file at 70

    results.set(i, 0, {
      deathAge1: deathAge.toFixed(2),
      bucket1: createBucket(deathAge),
      filingAge1: new MonthDuration(filingAgeMonths),
      totalBenefit: Money.from(600000 + deathAge * 1500),
      filingAge1Years: 70,
      filingAge1Months: 0,
    });
  }

  return results;
}

/**
 * Creates calculation results with a sharp transition in filing age.
 */
function createSharpTransitionResults(): CalculationResults {
  const startAge = 62;
  const endAge = 100;
  const numRows = (endAge - startAge) * 12;
  const results = new CalculationResults(numRows, 1);

  for (let i = 0; i < numRows; i++) {
    const deathAgeMonths = startAge * 12 + i;
    const deathAge = deathAgeMonths / 12;
    // Sharp transition at age 80
    const filingAgeMonths = deathAge < 80 ? 62 * 12 : 70 * 12;

    results.set(i, 0, {
      deathAge1: deathAge.toFixed(2),
      bucket1: createBucket(deathAge),
      filingAge1: new MonthDuration(filingAgeMonths),
      totalBenefit: Money.from(500000),
      filingAge1Years: Math.floor(filingAgeMonths / 12),
      filingAge1Months: filingAgeMonths % 12,
    });
  }

  return results;
}

/**
 * Creates a realistic death probability distribution.
 */
function createDeathProbDistribution(
  currentAge: number = 62
): { age: number; probability: number }[] {
  const distribution: { age: number; probability: number }[] = [];

  // Use a Gompertz-like mortality curve (exponentially increasing with age)
  for (let age = currentAge; age <= 120; age++) {
    // Approximate mortality probability that increases with age
    const baseRate = 0.001;
    const doublingTime = 8; // mortality doubles every ~8 years
    const prob = baseRate * 2 ** ((age - currentAge) / doublingTime);
    distribution.push({ age, probability: Math.min(prob, 1) });
  }

  // Normalize so probabilities sum to 1
  const total = distribution.reduce((sum, d) => sum + d.probability, 0);
  for (const d of distribution) {
    d.probability /= total;
  }

  return distribution;
}

export const Default: Story = {
  args: {
    recipient: createRecipient(1962, 3, 1, 2500),
    calculationResults: createTypicalCalculationResults(),
    deathProbDistribution: createDeathProbDistribution(),
    displayAsAges: true,
  },
};

export const DisplayAsDates: Story = {
  args: {
    recipient: createRecipient(1962, 3, 1, 2500),
    calculationResults: createTypicalCalculationResults(),
    deathProbDistribution: createDeathProbDistribution(),
    displayAsAges: false,
  },
};

export const FlatEarlyFiling: Story = {
  name: 'Flat Line - Early Filing (High Interest Rate)',
  args: {
    recipient: createRecipient(1962, 3, 1, 2500),
    calculationResults: createFlatEarlyFilingResults(),
    deathProbDistribution: createDeathProbDistribution(),
    displayAsAges: true,
  },
};

export const FlatLateFiling: Story = {
  name: 'Flat Line - Late Filing (Low Interest Rate)',
  args: {
    recipient: createRecipient(1962, 3, 1, 2500),
    calculationResults: createFlatLateFilingResults(),
    deathProbDistribution: createDeathProbDistribution(),
    displayAsAges: true,
  },
};

export const SharpTransition: Story = {
  name: 'Sharp Filing Age Transition',
  args: {
    recipient: createRecipient(1962, 3, 1, 2500),
    calculationResults: createSharpTransitionResults(),
    deathProbDistribution: createDeathProbDistribution(),
    displayAsAges: true,
  },
};
