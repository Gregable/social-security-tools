import type { Meta, StoryObj } from '@storybook/svelte';
import EarningsTestCalculator from '../routes/guides/earnings-test/EarningsTestCalculator.svelte';
import '../routes/guides/guide-styles.css';

const meta: Meta<EarningsTestCalculator> = {
  component: EarningsTestCalculator,
  title: 'Guides/EarningsTestCalculator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};
export default meta;

type Story = StoryObj<EarningsTestCalculator>;

/** The guide's Sarah: 63, $1,500 a month, $10,000 over the 2027 limit. */
export const UnderFullRetirementAge: Story = {
  args: {
    year: 2027,
    period: 'underFra',
    earnings: 35560,
    monthlyBenefit: 1500,
  },
};

/** The guide's Tom: reaches FRA in August, $73,000 earned before then. */
export const YearOfFullRetirementAge: Story = {
  args: {
    year: 2027,
    period: 'fraYear',
    earnings: 73000,
    monthlyBenefit: 2000,
  },
};

export const UnderTheLimit: Story = {
  args: {
    year: 2027,
    period: 'underFra',
    earnings: 20000,
    monthlyBenefit: 1500,
  },
};

export const EveryCheckWithheld: Story = {
  args: {
    year: 2027,
    period: 'underFra',
    earnings: 100000,
    monthlyBenefit: 1000,
  },
};
