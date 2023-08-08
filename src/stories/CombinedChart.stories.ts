import type {Meta} from '@storybook/svelte';
import CombinedChart from '../components/CombinedChart.svelte';

import {Recipient} from '../lib/recipient';
import {parsePaste} from '../lib/ssa-parse';
import {Birthdate} from '../lib/birthday';

import demo from '../../static/pastes/averagepaste.txt?raw';
import demo_spouse_low from '../../static/pastes/averagepaste-spouse.txt?raw';
import demo_spouse_high from '../../static/pastes/averagepaste-spouse-2.txt?raw';


let recipient = new Recipient();
recipient.name = 'Alex';
recipient.markFirst();
recipient.earningsRecords = parsePaste(demo);
recipient.birthdate = new Birthdate(new Date('1950-07-01'));

// This data is such that the spouse has a low enough PIA that they can claim
// spousal benefits, but not a zero PIA.
let spouseLowEarner = new Recipient();
spouseLowEarner.name = 'Chris';
spouseLowEarner.markSecond();
spouseLowEarner.earningsRecords = parsePaste(demo_spouse_low);
spouseLowEarner.birthdate = new Birthdate(new Date('1954-07-01'));

// This data is such that the spouse has a low enough PIA that they can claim
// spousal benefits, but not a zero PIA.
let spouseZeroEarner = new Recipient();
spouseZeroEarner.name = 'Chris';
spouseZeroEarner.markSecond();
spouseZeroEarner.birthdate = new Birthdate(new Date('1954-07-01'));

// This data is such that the spouse has a high enough PIA that they cannot
// claim spousal benefits.
let spouseHighEarner = new Recipient();
spouseHighEarner.name = 'Chris';
spouseHighEarner.markSecond();
spouseHighEarner.earningsRecords = parsePaste(demo_spouse_high);
spouseHighEarner.birthdate = new Birthdate(new Date('1954-07-01'));

const meta: Meta<CombinedChart> = {
  component: CombinedChart,
  title: 'Report/Combined/CombinedChart',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: CombinedChart,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  recipient: recipient,
  spouse: spouseLowEarner
};

export const NoSpousal = Template.bind({});
NoSpousal.args = {
  recipient: recipient,
  spouse: spouseHighEarner
};

export const SpouseZeroPia = Template.bind({});
SpouseZeroPia.args = {
  recipient: recipient,
  spouse: spouseZeroEarner
};
