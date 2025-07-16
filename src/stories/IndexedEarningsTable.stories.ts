import type { Meta } from '@storybook/svelte';
import IndexedEarningsTable from '../lib/components/IndexedEarningsTable.svelte';

import { context } from '$lib/context';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import { Birthdate } from '$lib/birthday';
import { EarningRecord } from '$lib/earning-record';

import demo0 from '$lib/pastes/averagepaste.txt?raw';

context.recipient = new Recipient();
context.recipient.earningsRecords = parsePaste(demo0);
// Add an incomplete record:
context.recipient.earningsRecords.push(
  (() => {
    let record = new EarningRecord({
      year: 2015,
      taxedEarnings: Money.from(0),
      taxedMedicareEarnings: Money.from(0),
    });
    record.incomplete = true;
    return record;
  })()
);
// Force reactivity update
// eslint-disable-next-line no-self-assign
context.recipient.earningsRecords = context.recipient.earningsRecords;
context.recipient.simulateFutureEarningsYears(5, Money.from(30 * 1000));
context.recipient.birthdate = Birthdate.FromYMD(1950, 6, 1);

const meta: Meta<IndexedEarningsTable> = {
  component: IndexedEarningsTable,
  title: 'Report/IndexedEarnings/IndexedEarningsTable',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: IndexedEarningsTable,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  recipient: context.recipient,
};
