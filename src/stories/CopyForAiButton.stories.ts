import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import demo from '$lib/pastes/averagepaste.txt?raw';
import demo_spouse_low from '$lib/pastes/averagepaste-spouse.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import CopyForAiButton from '../lib/components/CopyForAiButton.svelte';

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

const meta: Meta<CopyForAiButton> = {
  component: CopyForAiButton,
  title: 'Report/CopyForAiButton',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: CopyForAiButton,
  props: args,
});

// Single recipient: the export uses the single-person builder.
export const Single = Template.bind({});
Single.args = {
  recipient: recipient,
  spouse: null,
};

// Couple: the export uses the couple builder (adds spousal/survivor sections).
export const Couple = Template.bind({});
Couple.args = {
  recipient: recipient,
  spouse: spouse,
};
