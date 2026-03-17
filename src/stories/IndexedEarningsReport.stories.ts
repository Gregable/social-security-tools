import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';
import demo0 from '$lib/pastes/averagepaste.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import IndexedEarningsReport from '../lib/components/IndexedEarningsReport.svelte';

const recipient = new Recipient();
const incompleteRecord = new EarningRecord({
  year: 2015,
  taxedEarnings: Money.from(0),
  taxedMedicareEarnings: Money.from(0),
});
incompleteRecord.incomplete = true;
recipient.earningsRecords = [...parsePaste(demo0), incompleteRecord];
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
