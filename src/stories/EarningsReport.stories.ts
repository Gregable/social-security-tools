import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';
import demo0 from '$lib/pastes/averagepaste.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import EarningsReport from '../lib/components/EarningsReport.svelte';

const recipient = new Recipient();
recipient.earningsRecords = parsePaste(demo0);
// Add an incomplete record:
recipient.earningsRecords.push(
  (() => {
    const record = new EarningRecord({
      year: 2015,
      taxedEarnings: Money.from(0),
      taxedMedicareEarnings: Money.from(0),
    });
    record.incomplete = true;
    return record;
  })()
);
// eslint-disable-next-line no-self-assign
recipient.earningsRecords = recipient.earningsRecords;
recipient.birthdate = Birthdate.FromYMD(1950, 6, 1);
recipient.name = 'Alex';
recipient.markFirst();

const meta: Meta<EarningsReport> = {
  component: EarningsReport,
  title: 'Report/Earnings/EarningsReport',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: EarningsReport,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  recipient: recipient,
};
