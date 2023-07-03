import type {Meta} from '@storybook/svelte';
import EarningsTable from '../components/EarningsTable.svelte';

import {context} from '../lib/context';
import {Recipient} from '../lib/recipient';
import {parsePaste} from '../lib/ssa-parse';
import {Birthdate} from '../lib/birthday';
import {EarningRecord} from '../lib/earning-record';

import demo0 from '../assets/averagepaste.txt?raw';

context.recipient = new Recipient();
context.recipient.earningsRecords = parsePaste(demo0);
// Add an incomplete record:
context.recipient.earningsRecords.push((() => {
  let record = new EarningRecord(
      {year: 2015, taxedEarnings: -1, taxedMedicareEarnings: -1});
  record.incomplete = true;
  return record;
})());
context.recipient.earningsRecords = context.recipient.earningsRecords;
context.recipient.birthdate = new Birthdate(new Date('1950-07-01'));

const meta: Meta<EarningsTable> = {
  component: EarningsTable,
  title: 'Report/Earnings/EarningsTable',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: EarningsTable,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  isSpouse: false,
  futureTable: false,
};
