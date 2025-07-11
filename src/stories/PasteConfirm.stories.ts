import type { Meta } from '@storybook/svelte';
import { action } from '@storybook/addon-actions';

import PasteConfirm from '../lib/components/PasteConfirm.svelte';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';

const meta: Meta<PasteConfirm> = {
  component: PasteConfirm,
  title: 'Input/PasteFlow/PasteConfirm',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    earningsRecords: {
      control: 'object',
      description: 'User entered earnings records.',
    },
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: PasteConfirm,
  props: args,
  on: {
    confirm: action('confirm'),
    decline: action('decline'),
  },
});

export const Default = Template.bind({});
Default.args = {
  earningsRecords: [
    new EarningRecord({
      year: 2009,
      taxedEarnings: Money.from(39154),
      taxedMedicareEarnings: Money.from(39154),
    }),
    new EarningRecord({
      year: 2010,
      taxedEarnings: Money.from(39859),
      taxedMedicareEarnings: Money.from(39859),
    }),
    new EarningRecord({
      year: 2011,
      taxedEarnings: Money.from(42911),
      taxedMedicareEarnings: Money.from(42911),
    }),
    new EarningRecord({
      year: 2012,
      taxedEarnings: Money.from(44398),
      taxedMedicareEarnings: Money.from(44398),
    }),
    new EarningRecord({
      year: 2013,
      taxedEarnings: Money.from(44777),
      taxedMedicareEarnings: Money.from(44777),
    }),
  ],
};

export const NoMedicare = Template.bind({});
NoMedicare.args = {
  earningsRecords: [
    new EarningRecord({
      year: 2009,
      taxedEarnings: Money.from(39154),
      taxedMedicareEarnings: Money.from(0),
    }),
    new EarningRecord({
      year: 2010,
      taxedEarnings: Money.from(39859),
      taxedMedicareEarnings: Money.from(0),
    }),
    new EarningRecord({
      year: 2011,
      taxedEarnings: Money.from(42911),
      taxedMedicareEarnings: Money.from(0),
    }),
    new EarningRecord({
      year: 2012,
      taxedEarnings: Money.from(44398),
      taxedMedicareEarnings: Money.from(0),
    }),
    new EarningRecord({
      year: 2013,
      taxedEarnings: Money.from(44777),
      taxedMedicareEarnings: Money.from(0),
    }),
  ],
};
