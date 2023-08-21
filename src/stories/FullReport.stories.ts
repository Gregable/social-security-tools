import type {Meta} from '@storybook/svelte';
import App from '../routes/calculator/+page.svelte';

import {context} from '$lib/context';
import {Recipient} from '$lib/recipient';
import {parsePaste} from '$lib/ssa-parse';
import {Birthdate} from '$lib/birthday';

import demo from '$lib/pastes/averagepaste.txt?raw';
import demo_spouse_low from '$lib/pastes/averagepaste-spouse.txt?raw';

let recipient = new Recipient();
recipient.name = 'Alex';
recipient.markFirst();
recipient.earningsRecords = parsePaste(demo);
recipient.birthdate = Birthdate.FromYMD(1950, 6, 1);
context.recipient = recipient;

// This data is such that the spouse has a low enough PIA that they can claim
// spousal benefits, but not a zero PIA.
let spouseLowEarner = new Recipient();
spouseLowEarner.name = 'Chris';
spouseLowEarner.markSecond();
spouseLowEarner.earningsRecords = parsePaste(demo_spouse_low);
spouseLowEarner.birthdate = Birthdate.FromYMD(1950, 6, 1);
context.spouse = spouseLowEarner;

const meta: Meta<App> = {
  component: App,
  title: 'Report/Full Report',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: App,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  isPasteFlow: false
};

export const NoSpousal = Template.bind({});
NoSpousal.args = {
  isPasteFlow: false
};

export const SpouseZeroPia = Template.bind({});
SpouseZeroPia.args = {
  isPasteFlow: false
};
