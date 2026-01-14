import type { Meta, StoryObj } from '@storybook/svelte';
import { Money } from '../lib/money';
import { MonthDuration } from '../lib/month-time';
import AlternativeStrategiesGrid from '../routes/strategy/components/AlternativeStrategiesGrid.svelte';
import { createRecipientPair } from '../test/helpers/strategy-mocks';

const meta: Meta<AlternativeStrategiesGrid> = {
  title: 'Strategy/AlternativeStrategiesGrid',
  component: AlternativeStrategiesGrid,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const recipients = createRecipientPair();

// Default: Display as dates
export const Default: Story = {
  args: {
    recipients,
    deathAge1: new MonthDuration(85 * 12),
    deathAge2: new MonthDuration(87 * 12),
    discountRate: 0,
    optimalNPV: Money.from(750000),
    displayAsAges: false,
  },
};
Default.parameters = {
  docs: {
    description: {
      story:
        'Interactive 2D grid comparing all filing strategy combinations for a couple. Colors indicate percentage of optimal NPV (green = best, red = worst).',
    },
  },
};

// Display as ages
export const DisplayAsAges: Story = {
  args: {
    recipients,
    deathAge1: new MonthDuration(85 * 12),
    deathAge2: new MonthDuration(87 * 12),
    discountRate: 0,
    optimalNPV: Money.from(750000),
    displayAsAges: true,
  },
};
DisplayAsAges.parameters = {
  docs: {
    description: {
      story:
        'Grid displaying filing ages instead of dates in row/column headers.',
    },
  },
};

// With discount rate
export const WithDiscountRate: Story = {
  args: {
    recipients,
    deathAge1: new MonthDuration(85 * 12),
    deathAge2: new MonthDuration(87 * 12),
    discountRate: 3.5,
    optimalNPV: Money.from(550000),
    displayAsAges: false,
  },
};
WithDiscountRate.parameters = {
  docs: {
    description: {
      story:
        'Grid with a 3.5% discount rate applied. NPV values are lower due to time value of money adjustments.',
    },
  },
};

// Short life expectancy (truncated grid)
export const ShortLifeExpectancy: Story = {
  args: {
    recipients,
    deathAge1: new MonthDuration(68 * 12),
    deathAge2: new MonthDuration(70 * 12),
    discountRate: 0,
    optimalNPV: Money.from(250000),
    displayAsAges: false,
  },
};
ShortLifeExpectancy.parameters = {
  docs: {
    description: {
      story:
        'Grid with short life expectancies (68 and 70). Filing options are limited since recipients die before age 70.',
    },
  },
};

// Long life expectancy
export const LongLifeExpectancy: Story = {
  args: {
    recipients,
    deathAge1: new MonthDuration(95 * 12),
    deathAge2: new MonthDuration(92 * 12),
    discountRate: 0,
    optimalNPV: Money.from(1200000),
    displayAsAges: false,
  },
};
LongLifeExpectancy.parameters = {
  docs: {
    description: {
      story:
        'Grid with long life expectancies showing the full range of filing options from 62 to 70.',
    },
  },
};
