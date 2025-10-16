import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import demo from '$lib/pastes/averagepaste.txt?raw';
import demo_spouse_low from '$lib/pastes/averagepaste-spouse.txt?raw';
import demo_spouse_high from '$lib/pastes/averagepaste-spouse-2.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import CombinedChart from '../lib/components/CombinedChart.svelte';

const recipient = new Recipient();
recipient.name = 'Alex';
recipient.markFirst();
recipient.earningsRecords = parsePaste(demo);
recipient.birthdate = Birthdate.FromYMD(1950, 6, 1);

// This data is such that the spouse has a low enough PIA that they can claim
// spousal benefits, but not a zero PIA.
const spouseLowEarner = new Recipient();
spouseLowEarner.name = 'Chris';
spouseLowEarner.markSecond();
spouseLowEarner.earningsRecords = parsePaste(demo_spouse_low);
spouseLowEarner.birthdate = Birthdate.FromYMD(1954, 6, 1);
// This data is such that the spouse has a low enough PIA that they can claim
// spousal benefits, but not a zero PIA.
const spouseZeroEarner = new Recipient();
spouseZeroEarner.name = 'Chris';
spouseZeroEarner.markSecond();
spouseZeroEarner.birthdate = Birthdate.FromYMD(1954, 6, 1);

// This data is such that the spouse has a high enough PIA that they cannot
// claim spousal benefits.
const spouseHighEarner = new Recipient();
spouseHighEarner.name = 'Chris';
spouseHighEarner.markSecond();
spouseHighEarner.earningsRecords = parsePaste(demo_spouse_high);
spouseHighEarner.birthdate = Birthdate.FromYMD(1954, 6, 1);

const meta: Meta<CombinedChart> = {
  component: CombinedChart,
  title: 'Report/Combined/CombinedChart',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: CombinedChart,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  recipient: recipient,
  spouse: spouseLowEarner,
};

export const NoSpousal = Template.bind({});
NoSpousal.args = {
  recipient: recipient,
  spouse: spouseHighEarner,
};

export const SpouseZeroPia = Template.bind({});
SpouseZeroPia.args = {
  recipient: recipient,
  spouse: spouseZeroEarner,
};
