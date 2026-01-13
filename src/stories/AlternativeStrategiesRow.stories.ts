import type { Meta, StoryObj } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import AlternativeStrategiesRow from '../routes/strategy/components/AlternativeStrategiesRow.svelte';

const meta: Meta<AlternativeStrategiesRow> = {
  title: 'Strategy/AlternativeStrategiesRow',
  component: AlternativeStrategiesRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Creates a recipient with the given birthdate and PIA.
 */
function createRecipient(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  piaAmount: number
): Recipient {
  const recipient = new Recipient();
  recipient.birthdate = Birthdate.FromYMD(birthYear, birthMonth, birthDay);
  recipient.setPia(Money.from(piaAmount));
  recipient.name = 'Alex';
  recipient.markFirst();
  return recipient;
}

// Default story: typical recipient born mid-month
// Birthdate Feb 15, 1962 means earliest filing is 62y 1m (March 2024)
export const Default: Story = {
  args: {
    recipient: createRecipient(1962, 1, 15, 2000),
    deathAge: new MonthDuration(85 * 12),
    discountRate: 0,
    optimalNPV: Money.from(450000),
    optimalFilingAge: new MonthDuration(67 * 12),
    displayAsAges: false,
  },
};

// Recipient who can file right at 62y 0m (born on the 1st or 2nd of the month)
export const EarlyEligible: Story = {
  args: {
    recipient: createRecipient(1962, 5, 2, 1800),
    deathAge: new MonthDuration(90 * 12),
    discountRate: 0,
    optimalNPV: Money.from(520000),
    optimalFilingAge: new MonthDuration(70 * 12),
    displayAsAges: false,
  },
};

// Recipient born late in the month, can't file until 62y 1m
// Born Dec 25, 1960 - earliest filing is 62y 1m (Jan 2023)
export const LateMonthBirthday: Story = {
  args: {
    recipient: createRecipient(1960, 11, 25, 2500),
    deathAge: new MonthDuration(88 * 12),
    discountRate: 0,
    optimalNPV: Money.from(580000),
    optimalFilingAge: new MonthDuration(68 * 12 + 6),
    displayAsAges: false,
  },
};

// Display as ages instead of dates
export const DisplayAsAges: Story = {
  args: {
    recipient: createRecipient(1962, 1, 15, 2000),
    deathAge: new MonthDuration(85 * 12),
    discountRate: 0,
    optimalNPV: Money.from(450000),
    optimalFilingAge: new MonthDuration(67 * 12),
    displayAsAges: true,
  },
};

// Recipient with early optimal filing age
export const EarlyOptimal: Story = {
  args: {
    recipient: createRecipient(1965, 3, 10, 1500),
    deathAge: new MonthDuration(75 * 12),
    discountRate: 0,
    optimalNPV: Money.from(280000),
    optimalFilingAge: new MonthDuration(62 * 12 + 1),
    displayAsAges: false,
  },
};

// Recipient with late optimal filing age (age 70)
export const LateOptimal: Story = {
  args: {
    recipient: createRecipient(1965, 3, 10, 3000),
    deathAge: new MonthDuration(95 * 12),
    discountRate: 0,
    optimalNPV: Money.from(850000),
    optimalFilingAge: new MonthDuration(70 * 12),
    displayAsAges: false,
  },
};

// Shorter life expectancy - shows truncated grid
export const ShortLifeExpectancy: Story = {
  args: {
    recipient: createRecipient(1962, 5, 15, 2200),
    deathAge: new MonthDuration(68 * 12),
    discountRate: 0,
    optimalNPV: Money.from(180000),
    optimalFilingAge: new MonthDuration(62 * 12 + 1),
    displayAsAges: false,
  },
};

// With discount rate applied
export const WithDiscountRate: Story = {
  args: {
    recipient: createRecipient(1962, 1, 15, 2000),
    deathAge: new MonthDuration(85 * 12),
    discountRate: 3,
    optimalNPV: Money.from(320000),
    optimalFilingAge: new MonthDuration(65 * 12),
    displayAsAges: false,
  },
};

// Higher PIA recipient
export const HighEarner: Story = {
  args: {
    recipient: createRecipient(1963, 7, 20, 4000),
    deathAge: new MonthDuration(90 * 12),
    discountRate: 0,
    optimalNPV: Money.from(1100000),
    optimalFilingAge: new MonthDuration(70 * 12),
    displayAsAges: false,
  },
};
