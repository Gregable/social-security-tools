import type { Meta } from '@storybook/svelte';
import PiaReport from '../lib/components/PiaReport.svelte';

import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import { Birthdate } from '$lib/birthday';

import demo0 from '$lib/pastes/averagepaste.txt?raw';

let recipient = new Recipient();
recipient.name = 'Alex';
recipient.markFirst();
recipient.earningsRecords = parsePaste(demo0);
recipient.birthdate = Birthdate.FromYMD(1950, 6, 1);

const meta: Meta<PiaReport> = {
  component: PiaReport,
  title: 'Report/PIA/PiaReport',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: PiaReport,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  recipient: recipient,
};
