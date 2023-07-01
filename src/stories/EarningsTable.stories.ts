import type {Meta} from '@storybook/svelte';
import EarningsTable from '../components/EarningsTable.svelte';

// TODO: Should the component import the context from the store?
// TODO: Make this more reusable
import {context} from '../lib/context';
import {Recipient} from '../lib/recipient';
import {parsePaste} from '../lib/ssa-parse';
import {Birthdate} from '../lib/birthday';

import demo0 from '../assets/averagepaste.txt?raw';

context.recipient = new Recipient();
context.recipient.earningsRecords = parsePaste(demo0);
context.recipient.birthdate = new Birthdate(new Date('1950-07-01'));

const meta: Meta<EarningsTable> = {
  component: EarningsTable,
  title: 'Report/EarningsTable',
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
Default.args = {};
