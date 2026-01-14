import type { Meta, StoryObj } from '@storybook/svelte';
import StrategyDetailsSingle from '../routes/strategy/components/StrategyDetailsSingle.svelte';
import {
  createBucket,
  createRecipient,
  createStrategyResult,
} from '../test/helpers/strategy-mocks';

const meta: Meta<StrategyDetailsSingle> = {
  title: 'Strategy/StrategyDetailsSingle',
  component: StrategyDetailsSingle,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const recipient = createRecipient({
  birthYear: 1962,
  birthMonth: 3,
  birthDay: 1,
  piaAmount: 2500,
  name: 'Alex',
});

// Default: Standard single recipient details
export const Default: Story = {
  args: {
    recipient,
    result: createStrategyResult({
      deathAge1: 85,
      filingAgeMonths1: 67 * 12 + 3,
      totalBenefitCents: 52000000,
      bucket1: createBucket(85, {
        label: '85',
        midAge: 85,
        endAgeInclusive: 85,
      }),
      deathProb1: 0.35,
    }),
  },
};
Default.parameters = {
  docs: {
    description: {
      story:
        'Standard strategy details for a single recipient showing filing date, death date, NPV, and payment timeline.',
    },
  },
};

// Early filing at age 62
export const EarlyFiling: Story = {
  args: {
    recipient,
    result: createStrategyResult({
      deathAge1: 75,
      filingAgeMonths1: 62 * 12,
      totalBenefitCents: 28000000,
      bucket1: createBucket(75, {
        label: '75',
        midAge: 75,
        endAgeInclusive: 75,
      }),
      deathProb1: 0.15,
    }),
  },
};
EarlyFiling.parameters = {
  docs: {
    description: {
      story:
        'Details showing an early filing strategy at age 62 with a shorter life expectancy.',
    },
  },
};

// Late filing at age 70
export const LateFiling: Story = {
  args: {
    recipient,
    result: createStrategyResult({
      deathAge1: 95,
      filingAgeMonths1: 70 * 12,
      totalBenefitCents: 85000000,
      bucket1: createBucket(95, {
        label: '95',
        midAge: 95,
        endAgeInclusive: 95,
      }),
      deathProb1: 0.08,
    }),
  },
};
LateFiling.parameters = {
  docs: {
    description: {
      story:
        'Details showing a delayed filing strategy at age 70 with a long life expectancy.',
    },
  },
};

// Short life expectancy (death before 70)
export const ShortLifeExpectancy: Story = {
  args: {
    recipient,
    result: createStrategyResult({
      deathAge1: 68,
      filingAgeMonths1: 62 * 12 + 1,
      totalBenefitCents: 18000000,
      bucket1: createBucket(68, {
        label: '68',
        midAge: 68,
        endAgeInclusive: 68,
      }),
      deathProb1: 0.05,
    }),
  },
};
ShortLifeExpectancy.parameters = {
  docs: {
    description: {
      story:
        'Details for a scenario where death occurs before age 70, showing limited benefit collection period.',
    },
  },
};

// Mid-range filing with fractional months
export const MidRangeFiling: Story = {
  args: {
    recipient,
    result: createStrategyResult({
      deathAge1: 88,
      filingAgeMonths1: 66 * 12 + 6, // 66 years 6 months
      totalBenefitCents: 62000000,
      bucket1: createBucket(88, {
        label: '88',
        midAge: 88,
        endAgeInclusive: 88,
      }),
      deathProb1: 0.28,
    }),
  },
};
MidRangeFiling.parameters = {
  docs: {
    description: {
      story:
        'Details showing a mid-range filing age (66 years 6 months) demonstrating fractional month display.',
    },
  },
};

// High earner
export const HighEarner: Story = {
  args: {
    recipient: createRecipient({
      birthYear: 1962,
      birthMonth: 3,
      birthDay: 1,
      piaAmount: 4000, // Maximum PIA
      name: 'Alex',
    }),
    result: createStrategyResult({
      deathAge1: 90,
      filingAgeMonths1: 70 * 12,
      totalBenefitCents: 140000000,
      bucket1: createBucket(90, {
        label: '90',
        midAge: 90,
        endAgeInclusive: 90,
      }),
      deathProb1: 0.18,
    }),
  },
};
HighEarner.parameters = {
  docs: {
    description: {
      story:
        'Details for a high earner (maximum PIA of ~$4000) showing larger benefit amounts.',
    },
  },
};
