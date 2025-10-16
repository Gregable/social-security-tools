import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import demo0 from '$lib/pastes/averagepaste.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import FilingDateChart from '../lib/components/FilingDateChart.svelte';

const recipient = new Recipient();
recipient.earningsRecords = parsePaste(demo0);
recipient.birthdate = Birthdate.FromYMD(1950, 6, 1);
recipient.name = 'Alex';
recipient.markFirst();

const meta: Meta<FilingDateChart> = {
  component: FilingDateChart,
  title: 'Report/FilingDate/FilingDateChart',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: FilingDateChart,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  recipient: recipient,
};
