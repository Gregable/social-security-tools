import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';

import { recipient, spouse } from '$lib/context';
import demo from '$lib/pastes/averagepaste.txt?raw';
import demo_spouse_low from '$lib/pastes/averagepaste-spouse.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import App from '../routes/calculator/+page.svelte';

const r = new Recipient();
r.name = 'Alex';
r.markFirst();
r.earningsRecords = parsePaste(demo);
r.birthdate = Birthdate.FromYMD(1950, 6, 1);
recipient.set(r);

// This data is such that the spouse has a low enough PIA that they can claim
// spousal benefits, but not a zero PIA.
const spouseLowEarner = new Recipient();
spouseLowEarner.name = 'Chris';
spouseLowEarner.markSecond();
spouseLowEarner.earningsRecords = parsePaste(demo_spouse_low);
spouseLowEarner.birthdate = Birthdate.FromYMD(1950, 6, 1);
spouse.set(spouseLowEarner);

const meta: Meta<App> = {
  component: App,
  title: 'Report/Full Report',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: App,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  isPasteFlow: false,
};

export const NoSpousal = Template.bind({});
NoSpousal.args = {
  isPasteFlow: false,
};

export const SpouseZeroPia = Template.bind({});
SpouseZeroPia.args = {
  isPasteFlow: false,
};
