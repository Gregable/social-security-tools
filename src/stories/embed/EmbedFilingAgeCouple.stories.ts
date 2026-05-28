import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import CombinedChart from '$lib/components/CombinedChart.svelte';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';

function build(
  pia: number,
  dob: [number, number, number],
  first: boolean
): Recipient {
  const r = new Recipient();
  r.setPia(Money.from(pia));
  r.birthdate = Birthdate.FromYMD(dob[0], dob[1], dob[2]);
  if (first) {
    r.markFirst();
  } else {
    r.markSecond();
  }
  return r;
}

const recipient = build(3000, [1965, 8, 21], true);
const spouse = build(2200, [1967, 3, 10], false);

const meta: Meta<CombinedChart> = {
  component: CombinedChart,
  title: 'Embed/FilingAgeCouple',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: CombinedChart,
  props: args,
});

export const HappyPath = Template.bind({});
HappyPath.args = { recipient, spouse };
