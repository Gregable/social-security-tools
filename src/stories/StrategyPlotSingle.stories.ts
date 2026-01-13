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
 * Creates mock calculation results with a typical filing age curve.
 * Filing age starts at minimum (62) for early death ages, then increases
 * gradually to 70 for later death ages.
 */
function createTypicalCalculationResults(): CalculationResults {
  const results = new CalculationResults(39, 1); // Ages 62-100

  for (let i = 0; i < 39; i++) {
    const deathAge = 62 + i;
    // Filing age increases from 62 to 70 based on death age
    // Below ~75: file at 62, gradually increasing, above ~85: file at 70
    let filingAgeMonths: number;
    if (deathAge <= 75) {
      filingAgeMonths = 62 * 12; // File at 62
    } else if (deathAge >= 85) {
      filingAgeMonths = 70 * 12; // File at 70
    } else {
      // Linear interpolation between 75 and 85
      const ratio = (deathAge - 75) / 10;
      filingAgeMonths = Math.round(62 * 12 + ratio * (70 - 62) * 12);
    }

    results.set(i, 0, {
      deathAge1: deathAge.toString(),
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
  const results = new CalculationResults(39, 1);

  for (let i = 0; i < 39; i++) {
    const deathAge = 62 + i;
    const filingAgeMonths = 62 * 12; // Always file at 62

    results.set(i, 0, {
      deathAge1: deathAge.toString(),
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
  const results = new CalculationResults(39, 1);

  for (let i = 0; i < 39; i++) {
    const deathAge = 62 + i;
    const filingAgeMonths = 70 * 12; // Always file at 70

    results.set(i, 0, {
      deathAge1: deathAge.toString(),
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
  const results = new CalculationResults(39, 1);

  for (let i = 0; i < 39; i++) {
    const deathAge = 62 + i;
    // Sharp transition at age 80
    const filingAgeMonths = deathAge < 80 ? 62 * 12 : 70 * 12;

    results.set(i, 0, {
      deathAge1: deathAge.toString(),
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
 * Creates a simple death probability distribution for testing.
 */
function createDeathProbDistribution(
  currentAge: number = 62
): { age: number; probability: number }[] {
  const distribution: { age: number; probability: number }[] = [];
  let remaining = 1.0;

  for (let age = currentAge; age <= 120; age++) {
    // Simple increasing probability with age
    const prob = Math.min(remaining, 0.01 + (age - currentAge) * 0.002);
    distribution.push({ age, probability: prob });
    remaining -= prob;
    if (remaining <= 0) break;
  }

  return distribution;
}

export const Default: Story = {
  args: {
    recipient: createRecipient(1962, 3, 15, 2500),
    calculationResults: createTypicalCalculationResults(),
    deathProbDistribution: createDeathProbDistribution(),
    displayAsAges: true,
  },
};

export const DisplayAsDates: Story = {
  args: {
    recipient: createRecipient(1962, 3, 15, 2500),
    calculationResults: createTypicalCalculationResults(),
    deathProbDistribution: createDeathProbDistribution(),
    displayAsAges: false,
  },
};

export const FlatEarlyFiling: Story = {
  name: 'Flat Line - Early Filing (High Interest Rate)',
  args: {
    recipient: createRecipient(1962, 3, 15, 2500),
    calculationResults: createFlatEarlyFilingResults(),
    deathProbDistribution: createDeathProbDistribution(),
    displayAsAges: true,
  },
};

export const FlatLateFiling: Story = {
  name: 'Flat Line - Late Filing (Low Interest Rate)',
  args: {
    recipient: createRecipient(1962, 3, 15, 2500),
    calculationResults: createFlatLateFilingResults(),
    deathProbDistribution: createDeathProbDistribution(),
    displayAsAges: true,
  },
};

export const SharpTransition: Story = {
  name: 'Sharp Filing Age Transition',
  args: {
    recipient: createRecipient(1962, 3, 15, 2500),
    calculationResults: createSharpTransitionResults(),
    deathProbDistribution: createDeathProbDistribution(),
    displayAsAges: true,
  },
};

export const NoMortalityData: Story = {
  name: 'Without Mortality Curve',
  args: {
    recipient: createRecipient(1962, 3, 15, 2500),
    calculationResults: createTypicalCalculationResults(),
    deathProbDistribution: [],
    displayAsAges: true,
  },
};
