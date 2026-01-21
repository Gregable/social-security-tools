import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import demo from '$lib/pastes/averagepaste.txt?raw';
import demo_spouse_low from '$lib/pastes/averagepaste-spouse.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import SurvivorReportWrapper from './SurvivorReportWrapper.svelte';

const meta: Meta<SurvivorReportWrapper> = {
  component: SurvivorReportWrapper,
  title: 'Report/Survivor/SurvivorReport',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: SurvivorReportWrapper,
  props: args,
});

const recipient = new Recipient();
recipient.name = 'Alex';
recipient.markFirst();
recipient.earningsRecords = parsePaste(demo);
recipient.birthdate = Birthdate.FromYMD(1950, 6, 1);

const spouse = new Recipient();
spouse.name = 'Chris';
spouse.markSecond();
spouse.earningsRecords = parsePaste(demo_spouse_low);
spouse.birthdate = Birthdate.FromYMD(1950, 6, 1);

// Default is someone with sufficient earned credits.
export const Default = Template.bind({});
Default.args = {
  recipient: recipient,
  spouse: spouse,
};

const recipient2 = new Recipient();
recipient2.name = 'Alex';
recipient2.markFirst();
recipient2.earningsRecords = parsePaste(demo);
recipient2.birthdate = Birthdate.FromYMD(1942, 6, 1);

const spouse2 = new Recipient();
spouse2.name = 'Chris';
spouse2.markSecond();
spouse2.earningsRecords = parsePaste(demo_spouse_low);
spouse2.birthdate = Birthdate.FromYMD(1942, 6, 1);

// Older birthdate scenario (1942)
export const Older1942 = Template.bind({});
Older1942.args = {
  recipient: recipient2,
  spouse: spouse2,
};

// Recipients with 2.5 year age difference
const recipient3 = new Recipient();
recipient3.name = 'Alex';
recipient3.markFirst();
recipient3.earningsRecords = parsePaste(demo);
recipient3.birthdate = Birthdate.FromYMD(1950, 6, 1);

const spouse3 = new Recipient();
spouse3.name = 'Chris';
spouse3.markSecond();
spouse3.earningsRecords = parsePaste(demo_spouse_low);
spouse3.birthdate = Birthdate.FromYMD(1953, 0, 1); // 2.5 years younger (Jan 1953)

// 2.5 year age difference scenario
export const AgeDifference2_5Years = Template.bind({});
AgeDifference2_5Years.args = {
  recipient: recipient3,
  spouse: spouse3,
};
