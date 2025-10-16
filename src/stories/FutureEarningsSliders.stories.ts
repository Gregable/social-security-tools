import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import * as constants from '$lib/constants';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';
import FutureEarningsSliders from '../lib/components/FutureEarningsSliders.svelte';

const meta: Meta<FutureEarningsSliders> = {
  component: FutureEarningsSliders,
  title: 'Report/Earnings/FutureEarningsSliders',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const recipient = new Recipient();
recipient.name = 'Alex';
recipient.markFirst();
recipient.birthdate = Birthdate.FromYMD(constants.CURRENT_YEAR - 47, 3, 4);
const earnings = [
  new EarningRecord({
    year: constants.CURRENT_YEAR - 1,
    taxedEarnings: Money.from(50100.23),
    taxedMedicareEarnings: Money.from(0),
  }),
];
recipient.earningsRecords = earnings;

const Template = ({ ...args }) => ({
  Component: FutureEarningsSliders,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  recipient: recipient,
};
