import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import demo0 from '$lib/pastes/averagepaste.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import NormalRetirementAgeReport from '../lib/components/NormalRetirementAgeReport.svelte';

const meta: Meta<NormalRetirementAgeReport> = {
  component: NormalRetirementAgeReport,
  title: 'Report/PIA/NormalRetirementAgeReport',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: NormalRetirementAgeReport,
  props: args,
});

const r1 = new Recipient();
r1.earningsRecords = parsePaste(demo0);
r1.birthdate = Birthdate.FromYMD(1950, 6, 1);
r1.name = 'Alex';
r1.markFirst();
export const Default = Template.bind({});
Default.args = {
  recipient: r1,
};
