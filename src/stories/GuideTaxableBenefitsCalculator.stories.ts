import type { Meta, StoryObj } from '@storybook/svelte';
import TaxableBenefitsCalculator from '../routes/guides/federal-taxes/TaxableBenefitsCalculator.svelte';
import '../routes/guides/guide-styles.css';

const meta: Meta<TaxableBenefitsCalculator> = {
  component: TaxableBenefitsCalculator,
  title: 'Guides/TaxableBenefitsCalculator',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};
export default meta;

type Story = StoryObj<TaxableBenefitsCalculator>;

/** The guide's example: provisional income $39,200, single. */
export const Single: Story = {
  args: {
    status: 'single',
    agi: 30000,
    taxExemptInterest: 1200,
    benefits: 16000,
  },
};

/** The same numbers on a joint return land in the middle band. */
export const Joint: Story = {
  args: {
    status: 'joint',
    agi: 30000,
    taxExemptInterest: 1200,
    benefits: 16000,
  },
};

export const NoneTaxable: Story = {
  args: {
    status: 'single',
    agi: 10000,
    taxExemptInterest: 0,
    benefits: 16000,
  },
};

export const MaximumTaxable: Story = {
  args: {
    status: 'joint',
    agi: 120000,
    taxExemptInterest: 0,
    benefits: 30000,
  },
};
