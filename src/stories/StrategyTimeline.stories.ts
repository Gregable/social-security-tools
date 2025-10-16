import type { Meta, StoryObj } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import StrategyTimelineCanvas from '$lib/components/StrategyTimelineCanvas.svelte';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';
import { MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

// Create a simple mock StrategyResult type to avoid import issues
interface MockStrategyResult {
  filingAge1: MonthDuration;
  filingAge2: MonthDuration;
  bucket1: {
    expectedAge: MonthDuration;
    midAge: number;
    probability: number;
    probabilityRange: [number, number];
  };
  bucket2: {
    expectedAge: MonthDuration;
    midAge: number;
    probability: number;
    probabilityRange: [number, number];
  };
  totalValue: number;
  probability: number;
  rank: number;
}

// Create mock recipients
const recipient1 = new Recipient();
// Create earnings records for recipient1
const earningsValues1 = [
  20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000,
];
const earningsRecords1 = earningsValues1.map(
  (earnings, index) =>
    new EarningRecord({
      year: 1980 + index,
      taxedEarnings: Money.from(earnings),
      taxedMedicareEarnings: Money.from(earnings),
    })
);
recipient1.earningsRecords = earningsRecords1;
recipient1.birthdate = Birthdate.FromYMD(1960, 6, 1);
recipient1.name = 'Alex';

const recipient2 = new Recipient();
// Create earnings records for recipient2
const earningsValues2 = [
  15000, 18000, 20000, 22000, 25000, 28000, 30000, 32000, 35000, 38000,
];
const earningsRecords2 = earningsValues2.map(
  (earnings, index) =>
    new EarningRecord({
      year: 1982 + index,
      taxedEarnings: Money.from(earnings),
      taxedMedicareEarnings: Money.from(earnings),
    })
);
recipient2.earningsRecords = earningsRecords2;
recipient2.birthdate = Birthdate.FromYMD(1962, 8, 15);
recipient2.name = 'Chris';

// Create mock strategy result
const mockStrategyResult: MockStrategyResult = {
  filingAge1: MonthDuration.initFromYearsMonths({ years: 67, months: 0 }),
  filingAge2: MonthDuration.initFromYearsMonths({ years: 62, months: 0 }),
  bucket1: {
    expectedAge: MonthDuration.initFromYearsMonths({ years: 85, months: 0 }),
    midAge: 85,
    probability: 0.4,
    probabilityRange: [82, 88],
  },
  bucket2: {
    expectedAge: MonthDuration.initFromYearsMonths({ years: 87, months: 0 }),
    midAge: 87,
    probability: 0.5,
    probabilityRange: [84, 90],
  },
  totalValue: 850000,
  probability: 0.45,
  rank: 1,
};

const meta: Meta<StrategyTimelineCanvas> = {
  title: 'Strategy/StrategyTimelineCanvas',
  component: StrategyTimelineCanvas,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<StrategyTimelineCanvas>;

export const Default: Story = {
  args: {
    result: mockStrategyResult,
    recipients: [recipient1, recipient2] as [Recipient, Recipient],
    width: 800,
    height: 600,
  },
};

export const Compact: Story = {
  args: {
    result: mockStrategyResult,
    recipients: [recipient1, recipient2] as [Recipient, Recipient],
    width: 600,
    height: 400,
  },
};

export const Wide: Story = {
  args: {
    result: mockStrategyResult,
    recipients: [recipient1, recipient2] as [Recipient, Recipient],
    width: 1000,
    height: 500,
  },
};
