import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import EligibilityTable from '$lib/components/EligibilityTable.svelte';
import { context } from '$lib/context';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';
import demo0 from '$lib/pastes/averagepaste.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';

context.recipient = new Recipient();
context.recipient.earningsRecords = parsePaste(demo0);
// Add an incomplete record:
context.recipient.earningsRecords.push(
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
// Force reactivity update
// eslint-disable-next-line no-self-assign
context.recipient.earningsRecords = context.recipient.earningsRecords;
context.recipient.birthdate = Birthdate.FromYMD(1950, 6, 1);

const meta: Meta<EligibilityTable> = {
  component: EligibilityTable,
  title: 'Report/Eligibility/EligibilityTable',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: EligibilityTable,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  earningsRecords: context.recipient.earningsRecords,
};
