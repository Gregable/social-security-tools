import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import BendpointChart from '$lib/components/BendpointChart.svelte';
import demo0 from '$lib/pastes/averagepaste.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';

function happyRecipient(): Recipient {
  const r = new Recipient();
  r.earningsRecords = parsePaste(demo0);
  r.birthdate = Birthdate.FromYMD(1965, 8, 21);
  return r;
}

const meta: Meta<BendpointChart> = {
  component: BendpointChart,
  title: 'Embed/BendPoints',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: BendpointChart,
  props: args,
});

export const HappyPath = Template.bind({});
HappyPath.args = { recipient: happyRecipient() };
