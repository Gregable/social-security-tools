import type { Meta } from '@storybook/svelte';
import IndexedEarningsReport from '../lib/components/IndexedEarningsReport.svelte';

import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import { Birthdate } from '$lib/birthday';
import { EarningRecord } from '$lib/earning-record';

import demo0 from '$lib/pastes/averagepaste.txt?raw';

let recipient = new Recipient();
recipient.earningsRecords = parsePaste(demo0);
// Add an incomplete record:
recipient.earningsRecords.push(
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
recipient.earningsRecords = recipient.earningsRecords;
recipient.birthdate = Birthdate.FromYMD(1950, 6, 1);
recipient.name = 'Alex';
recipient.markFirst();

const meta: Meta<IndexedEarningsReport> = {
  component: IndexedEarningsReport,
  title: 'Report/IndexedEarnings/IndexedEarningsReport',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: IndexedEarningsReport,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  recipient: recipient,
};
