import type {Meta} from '@storybook/svelte';
import EligibilityTable from '../components/EligibilityTable.svelte';

import {context} from '../lib/context';
import {Recipient} from '../lib/recipient';
import {parsePaste} from '../lib/ssa-parse';
import {Money} from '../lib/money';
import {Birthdate} from '../lib/birthday';
import {EarningRecord} from '../lib/earning-record';


import demo0 from '../assets/averagepaste.txt?raw';

context.recipient = new Recipient();
context.recipient.earningsRecords = parsePaste(demo0);
// Add an incomplete record:
context.recipient.earningsRecords.push((() => {
  let record = new EarningRecord({
    year: 2015,
    taxedEarnings: Money.from(0),
    taxedMedicareEarnings: Money.from(0)
  });
  record.incomplete = true;
  return record;
})());
context.recipient.earningsRecords = context.recipient.earningsRecords;
context.recipient.birthdate = new Birthdate(new Date('1950-07-01'));

const meta: Meta<EligibilityTable> = {
  component: EligibilityTable,
  title: 'Report/Earnings/EligibilityTable',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: EligibilityTable,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  earningsRecords: context.recipient.earningsRecords,
};
