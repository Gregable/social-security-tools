import type { Meta, StoryObj } from '@storybook/svelte';
import ScenarioDetail from '../routes/strategy/components/ScenarioDetail.svelte';
import {
  createBucket,
  createRecipientPair,
  createStrategyResult,
} from '../test/helpers/strategy-mocks';

const meta: Meta<ScenarioDetail> = {
  title: 'Strategy/ScenarioDetail',
  component: ScenarioDetail,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const recipients = createRecipientPair();

const sampleResult = createStrategyResult({
  deathAge1: 85,
  deathAge2: 87,
  filingAgeMonths1: 67 * 12 + 3,
  filingAgeMonths2: 64 * 12 + 6,
  totalBenefitCents: 75000000,
  bucket1: createBucket(85, {
    label: '85',
    midAge: 85,
    endAgeInclusive: 86,
  }),
  bucket2: createBucket(87, {
    label: '87',
    midAge: 87,
    endAgeInclusive: 88,
  }),
  deathProb1: 0.12,
  deathProb2: 0.14,
});

export const Default: Story = {
  args: {
    recipients,
    result: sampleResult,
    discountRate: 0.025,
    displayAsAges: false,
    onBack: () => {},
  },
};
Default.parameters = {
  docs: {
    description: {
      story:
        'Unified scenario card combining the breadcrumb header, optimal filing strategy, payment timeline, and the alternatives heatmap.',
    },
  },
};

export const DisplayAsAges: Story = {
  args: {
    recipients,
    result: sampleResult,
    discountRate: 0.025,
    displayAsAges: true,
    onBack: () => {},
  },
};
DisplayAsAges.parameters = {
  docs: {
    description: {
      story:
        'Same scenario card with the parent toggle set to display ages instead of dates.',
    },
  },
};

export const EarlyFiling: Story = {
  args: {
    recipients,
    result: createStrategyResult({
      deathAge1: 75,
      deathAge2: 78,
      filingAgeMonths1: 62 * 12,
      filingAgeMonths2: 62 * 12,
      totalBenefitCents: 50000000,
      bucket1: createBucket(75, {
        label: '75',
        midAge: 75,
        endAgeInclusive: 76,
      }),
      bucket2: createBucket(78, {
        label: '78',
        midAge: 78,
        endAgeInclusive: 79,
      }),
      deathProb1: 0.05,
      deathProb2: 0.07,
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
        'A short-life-expectancy scenario where filing at 62 is optimal for both recipients.',
    },
  },
};
