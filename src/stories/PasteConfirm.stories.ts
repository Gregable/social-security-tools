import type {Meta} from '@storybook/svelte';
import {action} from '@storybook/addon-actions';

import PasteConfirm from '../components/PasteConfirm.svelte';
import {EarningRecord} from '../lib/earning-record';

const meta: Meta<PasteConfirm> = {
  component: PasteConfirm,
  title: 'Paste Confirm',
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

const Template = ({...args}) => ({
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
    new EarningRecord(
        {year: 2009, taxedEarnings: 39154, taxedMedicareEarnings: 39154}),
    new EarningRecord(
        {year: 2010, taxedEarnings: 39859, taxedMedicareEarnings: 39859}),
    new EarningRecord(
        {year: 2011, taxedEarnings: 42911, taxedMedicareEarnings: 42911}),
    new EarningRecord(
        {year: 2012, taxedEarnings: 44398, taxedMedicareEarnings: 44398}),
    new EarningRecord(
        {year: 2013, taxedEarnings: 44777, taxedMedicareEarnings: 44777}),
  ],
};
