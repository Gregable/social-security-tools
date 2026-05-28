import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import FilingDateChart from '$lib/components/FilingDateChart.svelte';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';

function build(pia: number, dob: [number, number, number]): Recipient {
  const r = new Recipient();
  r.setPia(Money.from(pia));
  r.birthdate = Birthdate.FromYMD(dob[0], dob[1], dob[2]);
  return r;
}

const meta: Meta<FilingDateChart> = {
  component: FilingDateChart,
  title: 'Embed/FilingAge',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: FilingDateChart,
  props: args,
});

export const HappyPath = Template.bind({});
HappyPath.args = { recipient: build(3000, [1965, 8, 21]) };

export const HighPia = Template.bind({});
HighPia.args = { recipient: build(4555, [1962, 0, 1]) };
