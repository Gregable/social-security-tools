import type { Meta, StoryObj } from '@storybook/svelte';
import ScenarioDetailSingle from '../routes/strategy/components/ScenarioDetailSingle.svelte';
import {
  createBucket,
  createRecipient,
  createStrategyResult,
} from '../test/helpers/strategy-mocks';

const meta: Meta<ScenarioDetailSingle> = {
  title: 'Strategy/ScenarioDetailSingle',
  component: ScenarioDetailSingle,
  parameters: {
    layout: 'fullscreen',
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
      deathProb1: 0.05,
    }),
    discountRate: 0.025,
    displayAsAges: false,
    onBack: () => {},
  },
};
Default.parameters = {
  docs: {
    description: {
      story:
        'Unified scenario card for the single-recipient flow. Shows optimal filing strategy, payment timeline, and the alternative-filing-age comparison row.',
    },
  },
};

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
      deathProb1: 0.03,
    }),
    discountRate: 0.025,
    displayAsAges: false,
    onBack: () => {},
  },
};
EarlyFiling.parameters = {
  docs: {
    description: {
      story:
        'Scenario where dying earlier makes filing at 62 the optimal strategy.',
    },
  },
};

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
      deathProb1: 0.02,
    }),
    discountRate: 0.025,
    displayAsAges: true,
    onBack: () => {},
  },
};
LateFiling.parameters = {
  docs: {
    description: {
      story:
        'Long-life scenario where filing at 70 is optimal. Toggle is set to ages.',
    },
  },
};
