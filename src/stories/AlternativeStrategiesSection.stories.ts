import type { Meta, StoryObj } from '@storybook/svelte';
import AlternativeStrategiesSection from '../routes/strategy/components/AlternativeStrategiesSection.svelte';
import {
  createBucket,
  createRecipientPair,
  createStrategyResult,
} from '../test/helpers/strategy-mocks';

const meta: Meta<AlternativeStrategiesSection> = {
  title: 'Strategy/AlternativeStrategiesSection',
  component: AlternativeStrategiesSection,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const recipients = createRecipientPair();

// Default: With result selected
export const Default: Story = {
  args: {
    recipients,
    result: createStrategyResult({
      deathAge1: 85,
      deathAge2: 87,
      filingAgeMonths1: 67 * 12 + 3,
      filingAgeMonths2: 64 * 12 + 6,
      totalBenefitCents: 75000000,
      bucket1: createBucket(84, {
        label: '85',
        midAge: 85,
        endAgeInclusive: 86,
      }),
      bucket2: createBucket(86, {
        label: '87',
        midAge: 87,
        endAgeInclusive: 88,
      }),
    }),
    discountRate: 0,
    displayAsAges: false,
  },
};
Default.parameters = {
  docs: {
    description: {
      story:
        'Section wrapper containing the alternative strategies grid with a selected result.',
    },
  },
};

// Display as ages
export const DisplayAsAges: Story = {
  args: {
    recipients,
    result: createStrategyResult({
      deathAge1: 85,
      deathAge2: 87,
      filingAgeMonths1: 67 * 12 + 3,
      filingAgeMonths2: 64 * 12 + 6,
      totalBenefitCents: 75000000,
      bucket1: createBucket(84, {
        label: '85',
        midAge: 85,
        endAgeInclusive: 86,
      }),
      bucket2: createBucket(86, {
        label: '87',
        midAge: 87,
        endAgeInclusive: 88,
      }),
    }),
    discountRate: 0,
    displayAsAges: true,
  },
};
DisplayAsAges.parameters = {
  docs: {
    description: {
      story:
        'Section with the age toggle enabled, showing filing ages instead of dates.',
    },
  },
};

// No result (hidden)
export const NoResult: Story = {
  args: {
    recipients,
    result: null,
    discountRate: 0,
    displayAsAges: false,
  },
};
NoResult.parameters = {
  docs: {
    description: {
      story:
        'Section with no result selected. The component renders nothing when result is null.',
    },
  },
};

// With discount rate
export const WithDiscountRate: Story = {
  args: {
    recipients,
    result: createStrategyResult({
      deathAge1: 85,
      deathAge2: 87,
      filingAgeMonths1: 65 * 12,
      filingAgeMonths2: 62 * 12 + 6,
      totalBenefitCents: 55000000,
      bucket1: createBucket(84, {
        label: '85',
        midAge: 85,
        endAgeInclusive: 86,
      }),
      bucket2: createBucket(86, {
        label: '87',
        midAge: 87,
        endAgeInclusive: 88,
      }),
    }),
    discountRate: 3.5,
    displayAsAges: false,
  },
};
WithDiscountRate.parameters = {
  docs: {
    description: {
      story: 'Section with a 3.5% discount rate applied to NPV calculations.',
    },
  },
};
