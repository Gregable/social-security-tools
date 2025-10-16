import type { Meta, StoryObj } from '@storybook/svelte';
import { Money } from '../lib/money';
import { MonthDuration } from '../lib/month-time';
import { Recipient } from '../lib/recipient';
import { parseBirthdate } from '../lib/strategy/ui';
import StrategyDetails from '../routes/strategy/components/StrategyDetails.svelte';

const meta: Meta<StrategyDetails> = {
  title: 'Strategy/StrategyDetails',
  component: StrategyDetails,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Create sample recipients
function createSampleRecipients(): [Recipient, Recipient] {
  const recipient1 = new Recipient();
  const recipient2 = new Recipient();

  recipient1.markFirst();
  recipient2.markSecond();
  recipient1.name = 'Alex';
  recipient2.name = 'Jordan';

  recipient1.birthdate = parseBirthdate('1965-03-15');
  recipient2.birthdate = parseBirthdate('1967-07-22');
  recipient1.setPia(Money.from(2500));
  recipient2.setPia(Money.from(1200));

  return [recipient1, recipient2];
}

// Create sample strategy result
const sampleResult = {
  filingAge1: new MonthDuration(67 * 12 + 3), // 67 years, 3 months
  filingAge2: new MonthDuration(62 * 12 + 6), // 62 years, 6 months
  filingAge1Years: 67,
  filingAge1Months: 3,
  filingAge2Years: 62,
  filingAge2Months: 6,
  totalBenefit: Money.from(750000),
  bucket1: {
    expectedAge: new MonthDuration(85 * 12), // 85 years
    midAge: 85,
  },
  bucket2: {
    expectedAge: new MonthDuration(87 * 12 + 6), // 87 years, 6 months
    midAge: 87.5,
  },
  deathProb1: 0.35,
  deathProb2: 0.42,
};

export const Default: Story = {
  args: {
    recipients: createSampleRecipients(),
    result: sampleResult,
  },
};

export const EarlyFiling: Story = {
  args: {
    recipients: createSampleRecipients(),
    result: {
      ...sampleResult,
      filingAge1: new MonthDuration(62 * 12), // 62 years exactly
      filingAge2: new MonthDuration(62 * 12), // 62 years exactly
      filingAge1Years: 62,
      filingAge1Months: 0,
      filingAge2Years: 62,
      filingAge2Months: 0,
      totalBenefit: Money.from(650000),
    },
  },
};

export const DelayedFiling: Story = {
  args: {
    recipients: createSampleRecipients(),
    result: {
      ...sampleResult,
      filingAge1: new MonthDuration(70 * 12), // 70 years exactly
      filingAge2: new MonthDuration(70 * 12), // 70 years exactly
      filingAge1Years: 70,
      filingAge1Months: 0,
      filingAge2Years: 70,
      filingAge2Months: 0,
      totalBenefit: Money.from(850000),
    },
  },
};
